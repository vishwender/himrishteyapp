import DualRangeField from '../../../components/DualRangeField';
import {
    LOOKING_FOR_OPTIONS,
    RELIGION_OPTIONS,
    MOTHER_TONGUE_OPTIONS,
    partnerHeightInches,
} from '../../../constants/profileOptions';
import SelectField from '../../../components/SelectField';

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
import { updatePartnerPreferencesProfile } from '../../../api/editProfileApi';
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
                placeholder: 'Write about the qualities you are looking for...',
                multiline: true,
            },
        ],
    },
];

const FIELDS = GROUPS.flatMap(group => group.fields);

const NUMBER_FIELDS = new Set(['partner_age_from', 'partner_age_to']);

// Selector positions use ten displayed inch choices per foot: .0 through .9.
function heightPosition(inches) {
    if (inches === '') return '';
    const feet = Math.floor(Number(inches) / 12),
        inch = Number(inches) % 12;
    return String(
        Math.max(0, Math.min(30, (feet - 4) * 10 + Math.min(inch, 10))),
    );
}
function positionHeight(position) {
    const value = Number(position);
    return String((4 + Math.floor(value / 10)) * 12 + (value % 10));
}

function incomeRangeValue(value) {
    const text = asText(value).trim();
    if (!text) return '';
    const match = /^(\d+)(?:\s+lakhs?)?$/i.exec(text);
    return match && Number(match[1]) <= 50 ? String(Number(match[1])) : '';
}

function asText(value) {
    return value === null || value === undefined ? '' : String(value);
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

    if (!/^\d+(\.\d+)?$/.test(value) || !Number.isFinite(Number(value))) {
        return false;
    }

    const number = Number(value);

    return (
        number >= min && number <= max && (!integer || Number.isInteger(number))
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

function FormField({
    field,
    value,
    onChangeText,
    form,
    onRangeChange,
    disabled,
}) {
    const dropdowns = {
        looking_for: LOOKING_FOR_OPTIONS,
        partner_religion: RELIGION_OPTIONS,
        partner_mothertongue: MOTHER_TONGUE_OPTIONS,
    };
    if (dropdowns[field.key])
        return (
            <View style={styles.field}>
                <Text style={styles.label}>{field.label}</Text>
                <SelectField
                    label={field.label}
                    value={value}
                    options={dropdowns[field.key]}
                    onChange={onChangeText}
                />
            </View>
        );
    const rangePrefix = field.key.startsWith('partner_age')
        ? 'partner_age'
        : field.key.startsWith('partner_height')
        ? 'partner_height'
        : field.key.startsWith('partner_annual_income')
        ? 'partner_annual_income'
        : null;
    if (rangePrefix) {
        if (field.key.endsWith('_to')) return null;
        const isHeight = rangePrefix === 'partner_height',
            isAge = rangePrefix === 'partner_age';
        return (
            <View>
                <DualRangeField
                    label={
                        isAge
                            ? 'Age'
                            : isHeight
                            ? 'Height (ft)'
                            : 'Annual Income (lpa)'
                    }
                    lower={
                        isHeight
                            ? heightPosition(form[rangePrefix + '_from'])
                            : form[rangePrefix + '_from']
                    }
                    upper={
                        isHeight
                            ? heightPosition(form[rangePrefix + '_to'])
                            : form[rangePrefix + '_to']
                    }
                    min={isAge ? 18 : 0}
                    max={isAge ? 70 : isHeight ? 30 : 50}
                    tickStep={5}
                    format={
                        isHeight
                            ? inches =>
                                  `${4 + Math.floor(inches / 10)}.${
                                      inches % 10
                                  }`
                            : String
                    }
                    disabled={disabled}
                    onChange={({ lower, upper }) =>
                        onRangeChange(
                            rangePrefix,
                            isHeight ? positionHeight(lower) : lower,
                            isHeight ? positionHeight(upper) : upper,
                        )
                    }
                />
            </View>
        );
    }
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
                                }
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        selected && styles.selectedOptionText,
                                    ]}
                                >
                                    {option}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {value && !field.options.includes(value) ? (
                    <Text style={styles.hint}>Current value: {value}</Text>
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
                textAlignVertical={field.multiline ? 'top' : 'center'}
                autoCorrect={false}
                style={[styles.input, field.multiline && styles.multiline]}
            />

            {isNumeric ? (
                <Text style={styles.hint}>
                    {field.numeric === 'integer'
                        ? 'Enter an age between 18 and 70.'
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

    const member = useMemo(
        () => user?.data?.member || user?.member || user || {},
        [user],
    );

    const initial = useMemo(() => {
        const values = {};

        FIELDS.forEach(field => {
            values[field.key] = field.key.startsWith('partner_height')
                ? partnerHeightInches(member[field.key])
                : field.key.startsWith('partner_annual_income')
                ? incomeRangeValue(member[field.key])
                : asText(member[field.key]);
        });

        return values;
    }, [member]);

    const [form, setForm] = useState(initial);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm(initial);
    }, [initial]);

    const updateField = (key, value) => {
        setForm(previous => {
            const next = { ...previous, [key]: value };
            for (const prefix of ['partner_age', 'partner_height']) {
                const from = prefix + '_from',
                    to = prefix + '_to';
                if (
                    key === from &&
                    next[to] !== '' &&
                    Number(value) > Number(next[to])
                )
                    next[to] = value;
                if (
                    key === to &&
                    next[from] !== '' &&
                    Number(value) < Number(next[from])
                )
                    next[from] = value;
            }
            return next;
        });
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
            Alert.alert('No Changes', 'You have not changed any preferences.');
            return;
        }

        const ageChanged =
            'partner_age_from' in changed || 'partner_age_to' in changed;

        if (
            ageChanged &&
            !validateRange(
                form,
                'partner_age_from',
                'partner_age_to',
                18,
                70,
                true,
            )
        ) {
            Alert.alert(
                'Invalid Age Range',
                'Age must be between 18 and 70. Minimum age cannot exceed maximum age.',
            );
            return;
        }

        if (
            ('partner_annual_income_from' in changed ||
                'partner_annual_income_to' in changed) &&
            !validateRange(
                form,
                'partner_annual_income_from',
                'partner_annual_income_to',
                0,
                50,
                true,
            )
        ) {
            Alert.alert(
                'Invalid Income Range',
                'Income must be between 0 and 50 lakhs. Minimum cannot exceed maximum.',
            );
            return;
        }
        const heightChanged =
            'partner_height_from' in changed || 'partner_height_to' in changed;

        if (
            heightChanged &&
            !validateRange(
                form,
                'partner_height_from',
                'partner_height_to',
                48,
                84,
                true,
            )
        ) {
            Alert.alert(
                'Invalid Height Range',
                'Height must be between 4 ft and 7 ft. Minimum height cannot exceed maximum height.',
            );
            return;
        }

        for (const key of ['partner_height_from', 'partner_height_to']) {
            if (key in changed && changed[key] !== null) {
                const inches = Number(changed[key]);
                if (inches % 12 > 9) {
                    Alert.alert(
                        'Invalid Height',
                        'Select a height from the updated range.',
                    );
                    return;
                }
                changed[key] = Number(
                    `${Math.floor(inches / 12)}.${inches % 12}`,
                );
            }
        }
        // Age and restricted .0–.9 height values match the existing numeric API.
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
                Alert.alert('Unable to Save', getErrorMessage(error));
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
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.heading}>
                <Text style={styles.title}>Partner Preferences</Text>

                <Text style={styles.subtitle}>
                    Set your preferences for a compatible life partner.
                </Text>
            </View>

            {GROUPS.map(group => (
                <View key={group.title} style={styles.card}>
                    <Text style={styles.sectionTitle}>{group.title}</Text>

                    {group.fields.map(field => (
                        <FormField
                            key={field.key}
                            field={field}
                            form={form}
                            disabled={saving}
                            onRangeChange={(prefix, lower, upper) =>
                                setForm(previous => ({
                                    ...previous,
                                    [prefix + '_from']: lower,
                                    [prefix + '_to']: upper,
                                }))
                            }
                            value={form[field.key] || ''}
                            onChangeText={value =>
                                updateField(field.key, value)
                            }
                        />
                    ))}
                </View>
            ))}

            <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabledButton]}
                disabled={saving}
                onPress={handleSave}
                activeOpacity={0.8}
            >
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
