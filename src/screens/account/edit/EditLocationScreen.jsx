
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
import { updateLocationProfile } from '../../../api/editProfileApi';
import colors from '../../../theme/colors';

const FIELDS = [
    {
        key: 'country_living_in',
        label: 'Country',
        placeholder: 'e.g. India',
        maxLength: 255,
    },
    {
        key: 'state_living_in',
        label: 'State',
        placeholder: 'e.g. Himachal Pradesh',
        maxLength: 255,
    },
    {
        key: 'city_living_in',
        label: 'City',
        placeholder: 'e.g. Kangra',
        maxLength: 255,
    },
    {
        key: 'address_living_in',
        label: 'Residential Address',
        placeholder: 'Enter your address',
        maxLength: 1000,
        multiline: true,
    },
    {
        key: 'native_place',
        label: 'Native Place',
        placeholder: 'e.g. Palampur',
        maxLength: 255,
    },
];

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
        'Unable to update location.'
    );
}

function FormField({ field, value, onChangeText }) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{field.label}</Text>

            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={field.placeholder}
                placeholderTextColor="#9992A5"
                maxLength={field.maxLength}
                multiline={Boolean(field.multiline)}
                textAlignVertical={
                    field.multiline ? 'top' : 'center'
                }
                autoCapitalize="words"
                autoCorrect={false}
                style={[
                    styles.input,
                    field.multiline && styles.multiline,
                ]}
            />

            {field.multiline ? (
                <Text style={styles.counter}>
                    {value.length} / {field.maxLength}
                </Text>
            ) : null}
        </View>
    );
}

export default function EditLocationScreen() {
    const navigation = useNavigation();
    const { user, refreshUser } = useAuth();

    const member =
        user?.data?.member ||
        user?.member ||
        user ||
        {};

    const initial = useMemo(
        () => ({
            country_living_in: asText(member.country_living_in),
            state_living_in: asText(member.state_living_in),
            city_living_in: asText(member.city_living_in),
            address_living_in: asText(member.address_living_in),
            native_place: asText(member.native_place),
        }),
        [
            member.country_living_in,
            member.state_living_in,
            member.city_living_in,
            member.address_living_in,
            member.native_place,
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

        FIELDS.forEach(field => {
            const before = asText(initial[field.key]).trim();
            const after = asText(form[field.key]).trim();

            if (before !== after) {
                changed[field.key] = after || null;
            }
        });

        if (Object.keys(changed).length === 0) {
            Alert.alert(
                'No Changes',
                'You have not changed any location details.',
            );
            return;
        }

        setSaving(true);
        let saved = false;

        try {
            await updateLocationProfile(changed);
            saved = true;

            await refreshUser();

            Alert.alert(
                'Location Updated',
                'Your location details were saved successfully.',
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
                    'Your location was saved, but profile refresh failed. Your information will refresh when you reopen Account.',
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
                    Location Details
                </Text>

                <Text style={styles.subtitle}>
                    Update where you live and your native place.
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                    Current Location
                </Text>

                {FIELDS.slice(0, 4).map(field => (
                    <FormField
                        key={field.key}
                        field={field}
                        value={form[field.key] || ''}
                        onChangeText={value =>
                            updateField(field.key, value)
                        }
                    />
                ))}
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                    Native Place
                </Text>

                <FormField
                    field={FIELDS[4]}
                    value={form.native_place || ''}
                    onChangeText={value =>
                        updateField('native_place', value)
                    }
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
                        Save Location Details
                    </Text>
                )}
            </TouchableOpacity>

            <Text style={styles.footer}>
                Only fields you change will be updated.
            </Text>
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
        fontSize: 25,
        fontWeight: '800',
        color: colors.title,
    },
    subtitle: {
        marginTop: 7,
        fontSize: 13,
        lineHeight: 20,
        color: colors.textSecondary,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EEEAF7',
        borderRadius: 17,
        padding: 17,
        marginTop: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.title,
        marginBottom: 20,
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
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E0EC',
        borderRadius: 11,
        paddingHorizontal: 13,
        paddingVertical: 12,
        fontSize: 14,
        color: colors.text,
    },
    multiline: {
        minHeight: 110,
        textAlignVertical: 'top',
    },
    counter: {
        marginTop: 5,
        fontSize: 11,
        color: colors.textSecondary,
        textAlign: 'right',
    },
    saveButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 16,
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
    footer: {
        textAlign: 'center',
        marginTop: 15,
        fontSize: 12,
        color: colors.textSecondary,
    },
});
