
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
import { updateLifestyleProfile } from '../../../api/editProfileApi';
import colors from '../../../theme/colors';

function asText(value) {
    return value === null || value === undefined
        ? ''
        : String(value);
}

function getErrorMessage(error) {
    const errors = error?.response?.data?.errors;

    if (errors && typeof errors === 'object') {
        const first = Object.values(errors)[0];

        if (Array.isArray(first) && first.length) {
            return String(first[0]);
        }
    }

    return (
        error?.response?.data?.message ||
        error?.message ||
        'Unable to update lifestyle details.'
    );
}

function FormField({
    label,
    value,
    onChangeText,
    placeholder,
    maxLength,
    multiline = false,
    hint,
}) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>

            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9992A5"
                maxLength={maxLength}
                multiline={multiline}
                textAlignVertical={multiline ? 'top' : 'center'}
                autoCorrect={false}
                style={[
                    styles.input,
                    multiline && styles.multiline,
                ]}
            />

            {multiline ? (
                <Text style={styles.counter}>
                    {value.length} / {maxLength}
                </Text>
            ) : null}

            {hint ? (
                <Text style={styles.hint}>{hint}</Text>
            ) : null}
        </View>
    );
}

function YesNoField({ label, value, onChange, hint }) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>

            <View style={styles.optionRow}>
                {['Yes', 'No'].map(option => {
                    const selected = value === option;

                    return (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.optionButton,
                                selected && styles.selectedOption,
                            ]}
                            onPress={() =>
                                onChange(selected ? '' : option)
                            }
                            activeOpacity={0.8}>

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

            {hint ? (
                <Text style={styles.hint}>{hint}</Text>
            ) : null}
        </View>
    );
}

export default function EditLifestyleScreen() {
    const navigation = useNavigation();
    const { user, refreshUser } = useAuth();

    const member =
        user?.data?.member ||
        user?.member ||
        user ||
        {};

    const initial = useMemo(
        () => ({
            diet: asText(member.diet),
            is_drinking: asText(member.is_drinking),
            is_smoking: asText(member.is_smoking),
            about_me: asText(member.about_me),
            any_disability: asText(member.any_disability),
        }),
        [
            member.diet,
            member.is_drinking,
            member.is_smoking,
            member.about_me,
            member.any_disability,
        ],
    );

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

        Object.keys(initial).forEach(key => {
            const before = asText(initial[key]).trim();
            const after = asText(form[key]).trim();

            if (before !== after) {
                changed[key] = after || null;
            }
        });

        if (Object.keys(changed).length === 0) {
            Alert.alert(
                'No Changes',
                'You have not changed any lifestyle details.',
            );
            return;
        }

        if (
            'is_drinking' in changed &&
            changed.is_drinking !== null &&
            !['Yes', 'No'].includes(changed.is_drinking)
        ) {
            Alert.alert(
                'Invalid Selection',
                'Please select Yes or No for drinking.',
            );
            return;
        }

        if (
            'is_smoking' in changed &&
            changed.is_smoking !== null &&
            !['Yes', 'No'].includes(changed.is_smoking)
        ) {
            Alert.alert(
                'Invalid Selection',
                'Please select Yes or No for smoking.',
            );
            return;
        }

        setSaving(true);

        let saved = false;

        try {
            await updateLifestyleProfile(changed);
            saved = true;

            await refreshUser();

            Alert.alert(
                'Lifestyle Updated',
                'Your lifestyle details were saved successfully.',
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
                    'Changes Saved',
                    'Your lifestyle details were saved, but refreshing your profile failed.',
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
                    Lifestyle & About Me
                </Text>

                <Text style={styles.subtitle}>
                    Share your lifestyle preferences and tell potential
                    matches more about yourself.
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                    Lifestyle
                </Text>

                <View style={styles.field}>
                    <Text style={styles.label}>Diet</Text>

                    <View style={styles.optionRow}>
                        {['Veg', 'Veg & Non-Veg'].map(option => {
                            const selected = form.diet === option;

                            return (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.optionButton,
                                        selected && styles.selectedOption,
                                    ]}
                                    onPress={() => updateField('diet', option)}
                                    activeOpacity={0.8}>

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
                </View>

                <YesNoField
                    label="Do You Drink?"
                    value={form.is_drinking}
                    onChange={value =>
                        updateField('is_drinking', value)
                    }
                    hint="Tap a selected option again to clear it."
                />

                <YesNoField
                    label="Do You Smoke?"
                    value={form.is_smoking}
                    onChange={value =>
                        updateField('is_smoking', value)
                    }
                    hint="Tap a selected option again to clear it."
                />
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                    About Me
                </Text>

                <FormField
                    label="My Introduction"
                    value={form.about_me}
                    onChangeText={value =>
                        updateField('about_me', value)
                    }
                    placeholder="Write something about your personality, interests, hobbies, and expectations..."
                    maxLength={3000}
                    multiline
                />
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                    Additional Information
                </Text>

                <FormField
                    label="Disability Information"
                    value={form.any_disability}
                    onChangeText={value =>
                        updateField('any_disability', value)
                    }
                    placeholder="Share information if you wish"
                    maxLength={1000}
                    multiline
                    hint="Optional. Only provide details you're comfortable sharing."
                />
            </View>

            <TouchableOpacity
                style={[
                    styles.saveButton,
                    saving && styles.disabledButton,
                ]}
                disabled={saving}
                onPress={handleSave}
                activeOpacity={0.8}>

                {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.saveText}>
                        Save Lifestyle Details
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
        borderRadius: 17,
        borderWidth: 1,
        borderColor: '#EEEAF7',
        padding: 17,
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 20,
    },
    field: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 9,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E0EC',
        backgroundColor: '#FFFFFF',
        borderRadius: 11,
        paddingHorizontal: 13,
        paddingVertical: 12,
        fontSize: 14,
        color: colors.text,
    },
    multiline: {
        minHeight: 130,
        textAlignVertical: 'top',
    },
    counter: {
        textAlign: 'right',
        marginTop: 6,
        fontSize: 11,
        color: colors.textSecondary,
    },
    hint: {
        fontSize: 11,
        marginTop: 8,
        color: colors.textSecondary,
        lineHeight: 17,
    },
    optionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    optionButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: '#E5E0EC',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
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
    saveButton: {
        marginTop: 20,
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.6,
    },
    saveText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15,
    },
});
