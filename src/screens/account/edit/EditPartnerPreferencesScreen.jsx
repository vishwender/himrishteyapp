
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
import {
    updatePartnerPreferencesProfile,
} from '../../../api/editProfileApi';
import colors from '../../../theme/colors';

const GROUPS = [
    {
        title: 'Basic Preferences',
        fields: [
            {
                key: 'looking_for',
                label: 'Looking For',
                maxLength: 100,
                placeholder: 'Describe your preference',
            },
            {
                key: 'partner_age_from',
                label: 'Minimum Age',
                numeric: 'integer',
                placeholder: 'e.g. 25',
            },
            {
                key: 'partner_age_to',
                label: 'Maximum Age',
                numeric: 'integer',
                placeholder: 'e.g. 35',
            },
            {
                key: 'partner_height_from',
                label: 'Minimum Height',
                numeric: 'decimal',
                placeholder: 'e.g. 5.0',
            },
            {
                key: 'partner_height_to',
                label: 'Maximum Height',
                numeric: 'decimal',
                placeholder: 'e.g. 6.0',
            },
        ],
    },
    {
        title: 'Religion & Community',
        fields: [
            {
                key: 'partner_religion',
                label: 'Preferred Religion',
                maxLength: 500,
            },
            {
                key: 'partner_cast',
                label: 'Preferred Caste',
                maxLength: 1000,
            },
            {
                key: 'partner_mothertongue',
                label: 'Preferred Mother Tongue',
                maxLength: 500,
            },
            {
                key: 'is_partner_manglik',
                label: 'Manglik Preference',
                options: ['Yes', 'No'],
            },
            {
                key: 'horoscope_needed',
                label: 'Horoscope Needed?',
                options: ['Yes', 'No'],
            },
        ],
    },
    {
        title: 'Location Preferences',
        fields: [
            {
                key: 'partner_country',
                label: 'Preferred Country',
                maxLength: 255,
            },
            {
                key: 'partner_state',
                label: 'Preferred State',
                maxLength: 255,
            },
            {
                key: 'partner_city',
                label: 'Preferred City',
                maxLength: 255,
            },
        ],
    },
    {
        title: 'Education & Career',
        fields: [
            {
                key: 'partner_education',
                label: 'Preferred Education',
                maxLength: 1000,
            },
            {
                key: 'partner_occupation',
                label: 'Preferred Occupation',
                maxLength: 500,
            },
            {
                key: 'partner_annual_income_from',
                label: 'Minimum Annual Income',
                maxLength: 100,
            },
            {
                key: 'partner_annual_income_to',
                label: 'Maximum Annual Income',
                maxLength: 100,
            },
        ],
    },
    {
        title: 'Lifestyle Preferences',
        fields: [
            {
                key: 'partner_diet',
                label: 'Preferred Diet',
                options: ['Veg', 'Veg & Non-Veg'],
            },
            {
                key: 'is_partner_smoking',
                label: 'Smoking Preference',
                options: ['Yes', 'No'],
            },
            {
                key: 'is_partner_drinking',
                label: 'Drinking Preference',
                options: ['Yes', 'No'],
            },
        ],
    },
    {
        title: 'About My Partner',
        fields: [
            {
                key: 'about_my_partner',
                label: 'Describe Your Ideal Partner',
                placeholder:
                    'Write about the qualities you are looking for...',
                multiline: true,
            },
        ],
    },
];

const FIELDS = GROUPS.flatMap(group => group.fields);

const NUMBER_FIELDS = new Set([
    'partner_age_from',
    'partner_age_to',
    'partner_height_from',
    'partner_height_to',
]);

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
        'Unable to update partner preferences.'
    );
}

function validateNumber(value, min, max, integer) {
    if (value === '') {
        return true;
    }

    if (
        !/^\d+(\.\d+)?$/.test(value) ||
        !Number.isFinite(Number(value))
    ) {
        return false;
    }

    const number = Number(value);

    return (
        number >= min &&
        number <= max &&
        (!integer || Number.isInteger(number))
    );
}

function validateRange(form, fromKey, toKey, min, max, integer) {
    const from = asText(form[fromKey]).trim();
    const to = asText(form[toKey]).trim();

    if (
        !validateNumber(from, min, max, integer) ||
        !validateNumber(to, min, max, integer)
    ) {
        return false;
    }

    if (from && to && Number(from) > Number(to)) {
        return false;
    }

    return true;
}

function FormField({ field, value, onChangeText }) {
    const isNumeric = Boolean(field.numeric);

    if (field.options) {
        return (
            <View style={styles.field}>
                <Text style={styles.label}>{field.label}</Text>

                <View style={styles.optionRow}>
                    {field.options.map(option => {
                        const selected = value === option;

                        return (
                            <TouchableOpacity
                                key={option}
                                style={[
                                    styles.optionButton,
                                    selected && styles.selectedOption,
                                ]}
                                activeOpacity={0.8}
                                onPress={() =>
                                    onChangeText(selected ? '' : option)
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

                {value && !field.options.includes(value) ? (
                    <Text style={styles.hint}>
                        Current value: {value}
                    </Text>
                ) : null}

                <Text style={styles.hint}>
                    Tap a selected option again to clear it.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.field}>
            <Text style={styles.label}>{field.label}</Text>

            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={field.placeholder || field.label}
                placeholderTextColor="#9992A5"
                maxLength={field.maxLength}
                keyboardType={
                    field.numeric === 'decimal'
                        ? 'decimal-pad'
                        : field.numeric === 'integer'
                            ? 'number-pad'
                            : 'default'
                }
                multiline={Boolean(field.multiline)}
                textAlignVertical={
                    field.multiline ? 'top' : 'center'
                }
                autoCorrect={false}
                style={[
                    styles.input,
                    field.multiline && styles.multiline,
                ]}
            />

            {isNumeric ? (
                <Text style={styles.hint}>
                    {field.numeric === 'integer'
                        ? 'Enter an age between 18 and 100.'
                        : 'Enter a numeric height from 3 to 8.'}
                </Text>
            ) : null}

            {field.multiline ? (
                <Text style={styles.hint}>
                    Describe your ideal match in your own words.
                </Text>
            ) : null}
        </View>
    );
}

export default function EditPartnerPreferencesScreen() {
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
            values[field.key] = asText(member[field.key]);
        });

        return values;
    }, [
        member.looking_for,
        member.partner_age_from,
        member.partner_age_to,
        member.partner_country,
        member.partner_religion,
        member.partner_cast,
        member.partner_height_from,
        member.partner_height_to,
        member.partner_education,
        member.partner_mothertongue,
        member.partner_annual_income_from,
        member.partner_annual_income_to,
        member.is_partner_manglik,
        member.partner_occupation,
        member.partner_state,
        member.partner_city,
        member.partner_diet,
        member.is_partner_smoking,
        member.is_partner_drinking,
        member.horoscope_needed,
        member.about_my_partner,
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
            const before = asText(initial[field.key]).trim();
            const after = asText(form[field.key]).trim();

            if (before !== after) {
                changed[field.key] = after || null;
            }
        });

        if (!Object.keys(changed).length) {
            Alert.alert(
                'No Changes',
                'You have not changed any preferences.',
            );
            return;
        }

        const ageChanged =
            'partner_age_from' in changed ||
            'partner_age_to' in changed;

        if (
            ageChanged &&
            !validateRange(
                form,
                'partner_age_from',
                'partner_age_to',
                18,
                100,
                true,
            )
        ) {
            Alert.alert(
                'Invalid Age Range',
                'Age must be between 18 and 100. Minimum age cannot exceed maximum age.',
            );
            return;
        }

        const heightChanged =
            'partner_height_from' in changed ||
            'partner_height_to' in changed;

        if (
            heightChanged &&
            !validateRange(
                form,
                'partner_height_from',
                'partner_height_to',
                3,
                8,
                false,
            )
        ) {
            Alert.alert(
                'Invalid Height Range',
                'Height must be between 3 and 8. Minimum height cannot exceed maximum height.',
            );
            return;
        }

        // Send actual JSON numbers for age and height.
        for (const key of NUMBER_FIELDS) {
            if (
                Object.prototype.hasOwnProperty.call(changed, key) &&
                changed[key] !== null
            ) {
                changed[key] = Number(changed[key]);
            }
        }

        setSaving(true);
        let saved = false;

        try {
            await updatePartnerPreferencesProfile(changed);
            saved = true;

            await refreshUser();

            Alert.alert(
                'Preferences Updated',
                'Your partner preferences were saved successfully.',
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
                    'Your preferences were saved, but refreshing your profile failed.',
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
                    Partner Preferences
                </Text>

                <Text style={styles.subtitle}>
                    Set your preferences for a compatible life partner.
                </Text>
            </View>

            {GROUPS.map(group => (
                <View key={group.title} style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        {group.title}
                    </Text>

                    {group.fields.map(field => (
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
            ))}

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
                        Save Partner Preferences
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
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E0EC',
        borderRadius: 11,
        paddingHorizontal: 13,
        paddingVertical: 12,
        color: colors.text,
        fontSize: 14,
    },
    multiline: {
        minHeight: 135,
        textAlignVertical: 'top',
    },
    hint: {
        marginTop: 7,
        color: colors.textSecondary,
        fontSize: 11,
        lineHeight: 17,
    },
    optionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    optionButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E0EC',
        borderRadius: 11,
        paddingVertical: 13,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    selectedOption: {
        borderColor: colors.primary,
        backgroundColor: '#EFE9FF',
    },
    optionText: {
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 12,
        textAlign: 'center',
    },
    selectedOptionText: {
        color: colors.primary,
        fontWeight: '800',
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
});
