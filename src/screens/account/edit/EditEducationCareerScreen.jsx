import {
    EMPLOYMENT_OPTIONS,
    INCOME_OPTIONS,
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
import { updateEducationCareerProfile } from '../../../api/editProfileApi';
import colors from '../../../theme/colors';

const FIELD_GROUPS = [
    {
        title: 'Education Details',
        fields: [
            {
                key: 'education',
                label: 'Highest Qualification',
                placeholder: 'e.g. B.Tech, MBA, Graduation',
                maxLength: 255,
            },
            {
                key: 'any_other_qualifications',
                label: 'Other Qualifications',
                placeholder: 'Additional qualifications or certifications',
                maxLength: 2000,
                multiline: true,
            },
            {
                key: 'about_my_education',
                label: 'About My Education',
                placeholder: 'Tell others about your education',
                maxLength: 3000,
                multiline: true,
            },
        ],
    },
    {
        title: 'Career Details',
        fields: [
            {
                key: 'employed_in',
                label: 'Employed In',
                placeholder: 'e.g. Private, Government, Business',
                maxLength: 100,
            },
            {
                key: 'occupation',
                label: 'Occupation',
                placeholder: 'e.g. Software Engineer',
                maxLength: 255,
            },
            {
                key: 'designation',
                label: 'Designation',
                placeholder: 'e.g. Senior Developer',
                maxLength: 255,
            },
            {
                key: 'organization_name',
                label: 'Organization Name',
                placeholder: 'Company or organization',
                maxLength: 255,
            },
            {
                key: 'job_location',
                label: 'Job Location',
                placeholder: 'e.g. Chandigarh',
                maxLength: 255,
            },
            {
                key: 'annual_income',
                label: 'Annual Income',
                placeholder: 'Enter income as used in your profile',
                maxLength: 100,
            },
            {
                key: 'about_my_career',
                label: 'About My Career',
                placeholder: 'Describe your work and career',
                maxLength: 3000,
                multiline: true,
            },
        ],
    },
];

const ALL_FIELDS = FIELD_GROUPS.flatMap(group => group.fields);

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
        'Unable to save education and career details.'
    );
}

function FormField({ field, value, onChangeText }) {
    const options =
        field.key === 'employed_in'
            ? EMPLOYMENT_OPTIONS
            : field.key === 'annual_income'
            ? INCOME_OPTIONS
            : null;
    if (options)
        return (
            <View style={styles.field}>
                <Text style={styles.label}>{field.label}</Text>
                <SelectField
                    label={field.label}
                    value={value}
                    options={options}
                    onChange={onChangeText}
                />
            </View>
        );
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{field.label}</Text>

            <TextInput
                value={value}
                onChangeText={onChangeText}
                style={[styles.input, field.multiline && styles.multiline]}
                placeholder={field.placeholder}
                placeholderTextColor="#9992A5"
                maxLength={field.maxLength}
                multiline={Boolean(field.multiline)}
                textAlignVertical={field.multiline ? 'top' : 'center'}
                autoCapitalize="sentences"
                autoCorrect={false}
            />

            {field.multiline ? (
                <Text style={styles.counter}>
                    {value.length} / {field.maxLength}
                </Text>
            ) : null}
        </View>
    );
}

export default function EditEducationCareerScreen() {
    const navigation = useNavigation();
    const { user, refreshUser } = useAuth();

    const member = useMemo(
        () => user?.data?.member || user?.member || user || {},
        [user],
    );

    const initial = useMemo(() => {
        const values = {};

        ALL_FIELDS.forEach(field => {
            values[field.key] = asText(member[field.key]);
        });

        return values;
    }, [member]);

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

        ALL_FIELDS.forEach(field => {
            const before = asText(initial[field.key]).trim();
            const after = asText(form[field.key]).trim();

            if (before !== after) {
                changed[field.key] = after || null;
            }
        });

        if (Object.keys(changed).length === 0) {
            Alert.alert('No Changes', 'You have not changed any details.');
            return;
        }

        setSaving(true);

        let saved = false;

        try {
            await updateEducationCareerProfile(changed);
            saved = true;

            await refreshUser();

            Alert.alert(
                'Profile Updated',
                'Education and career details saved successfully.',
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
                    'Your changes were saved, but the profile refresh failed.',
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
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.heading}>
                <Text style={styles.title}>Education & Career</Text>

                <Text style={styles.subtitle}>
                    Share your qualifications, employment and career details.
                </Text>
            </View>

            {FIELD_GROUPS.map(group => (
                <View key={group.title} style={styles.card}>
                    <Text style={styles.sectionTitle}>{group.title}</Text>

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
                style={[styles.saveButton, saving && styles.disabledButton]}
                disabled={saving}
                onPress={handleSave}
                activeOpacity={0.8}
            >
                {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.saveText}>Save Education & Career</Text>
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
        marginBottom: 19,
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
        minHeight: 100,
        textAlignVertical: 'top',
    },
    counter: {
        textAlign: 'right',
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 5,
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
});
