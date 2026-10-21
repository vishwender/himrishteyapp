
import React, { useEffect, useMemo, useState } from 'react';

import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Keyboard,
    StyleSheet,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../../context/AuthContext';
import { updateReligionProfile } from '../../../api/editProfileApi';
import colors from '../../../theme/colors';

const FIELDS = [
    {
        key: 'religion',
        label: 'Religion',
        placeholder: 'e.g. Hindu',
        maxLength: 100,
    },
    {
        key: 'mother_tongue',
        label: 'Mother Tongue',
        placeholder: 'e.g. Hindi, Dogri, Pahari',
        maxLength: 100,
    },
    {
        key: 'cast',
        label: 'Caste',
        placeholder: 'Enter your caste',
        maxLength: 100,
    },
    {
        key: 'sub_cast',
        label: 'Sub-Caste',
        placeholder: 'Enter your sub-caste',
        maxLength: 100,
    },
    {
        key: 'gotra',
        label: 'Gotra',
        placeholder: 'Enter your gotra',
        maxLength: 100,
    },
];

function textValue(value) {
    return value === null || value === undefined
        ? ''
        : String(value);
}

function getErrorMessage(error) {
    const validationErrors = error?.response?.data?.errors;

    if (validationErrors) {
        const first = Object.values(validationErrors)[0];

        if (Array.isArray(first) && first.length) {
            return String(first[0]);
        }
    }

    return (
        error?.response?.data?.message ||
        error?.message ||
        'Unable to update your profile.'
    );
}

function FormField({
    label,
    placeholder,
    value,
    onChangeText,
    maxLength,
}) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>

            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9992A5"
                maxLength={maxLength}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
            />
        </View>
    );
}

export default function EditReligionScreen() {
    const navigation = useNavigation();

    const { user, refreshUser } = useAuth();

    const member =
        user?.data?.member ||
        user?.member ||
        user ||
        {};

    const initial = useMemo(() => {
        const values = {};

        FIELDS.forEach(field => {
            values[field.key] = textValue(
                member?.[field.key],
            );
        });

        values.manglik = textValue(member?.manglik);
        return values;
    }, [
        member?.religion,
        member?.mother_tongue,
        member?.cast,
        member?.sub_cast,
        member?.gotra,
        member?.manglik,
    ]);

    const [form, setForm] = useState(initial);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm(initial);
    }, [initial]);

    const updateField = (key, value) => {
        setForm(previous => ({
            ...previous,
            [key]: value,
        }));
    };

    const handleSave = async () => {
        if (saving) {
            return;
        }

        Keyboard.dismiss();

        const changed = {};

        FIELDS.forEach(field => {
            const before = textValue(
                initial[field.key],
            ).trim();

            const after = textValue(
                form[field.key],
            ).trim();

            if (before !== after) {
                changed[field.key] = after || null;
            }
        });

        const originalManglik = textValue(initial.manglik).trim();
        const updatedManglik = textValue(form.manglik).trim();

        if (originalManglik !== updatedManglik) {
            changed.manglik = updatedManglik || null;
        }

        if (Object.keys(changed).length === 0) {
            Alert.alert(
                'No Changes',
                'You have not changed any details.',
            );
            return;
        }

        setSaving(true);

        let saved = false;

        try {
            await updateReligionProfile(changed);
            saved = true;

            // Refresh shared profile information in AuthContext.
            await refreshUser();

            Alert.alert(
                'Profile Updated',
                'Religion and community details saved successfully.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ],
            );
        } catch (error) {
            if (saved) {
                Alert.alert(
                    'Saved',
                    'Your changes were saved, but profile refresh failed. Reopen your account to refresh.',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack(),
                        },
                    ],
                );
            } else {
                Alert.alert(
                    'Unable to Save',
                    getErrorMessage(error),
                );
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            <View style={styles.heading}>
                <Text style={styles.title}>
                    Religion & Community
                </Text>

                <Text style={styles.subtitle}>
                    Update your religious and community information.
                </Text>
            </View>

            <View style={styles.card}>
                {FIELDS.map(field => (
                    <FormField
                        key={field.key}
                        label={field.label}
                        placeholder={field.placeholder}
                        maxLength={field.maxLength}
                        value={form[field.key] || ''}
                        onChangeText={value =>
                            updateField(field.key, value)
                        }
                    />
                ))}
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Manglik</Text>

                <View style={styles.optionRow}>
                    {['Yes', 'No'].map(option => {
                        const selected = form.manglik === option;

                        return (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.optionButton,
                                    selected && styles.selectedOption,
                                ]}
                                onPress={() =>
                                    updateField('manglik', selected ? '' : option)
                                }>
                                <Text
                                    style={[
                                        styles.optionText,
                                        selected && styles.selectedOptionText,
                                    ]}>
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.hint}>
                    Tap a selected option again to clear it.
                </Text>
            </View>

            <TouchableOpacity
                style={[
                    styles.saveButton,
                    saving && styles.disabledButton,
                ]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}>

                {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.saveText}>
                        Save Changes
                    </Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF9FF',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    heading: {
        paddingVertical: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
    },
    subtitle: {
        fontSize: 13,
        lineHeight: 20,
        color: colors.textSecondary,
        marginTop: 7,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EEEAF7',
        borderRadius: 17,
        padding: 17,
        marginTop: 12,
    },
    field: {
        marginBottom: 18,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E0EC',
        borderRadius: 11,
        paddingHorizontal: 13,
        paddingVertical: 12,
        fontSize: 14,
        color: colors.text,
        backgroundColor: '#FFFFFF',
    },
    saveButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        marginTop: 20,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.6,
    },
    saveText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },

    optionRow: {
        flexDirection: 'row',
        gap: 12,
    },

    optionButton: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E0EC',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },

    selectedOption: {
        backgroundColor: '#EFE9FF',
        borderColor: colors.primary,
    },

    optionText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },

    selectedOptionText: {
        color: colors.primary,
        fontWeight: '800',
    },

    hint: {
        marginTop: 8,
        fontSize: 11,
        color: colors.textSecondary,
    },
});
