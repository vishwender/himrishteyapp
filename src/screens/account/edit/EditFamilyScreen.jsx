
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
import { updateFamilyProfile } from '../../../api/editProfileApi';
import colors from '../../../theme/colors';

const GROUPS = [
    {
        title: 'Family Information',
        fields: [
            { key: 'family_type', label: 'Family Type', maxLength: 100, placeholder: 'e.g. Nuclear, Joint' },
            { key: 'family_status', label: 'Family Status', maxLength: 100, placeholder: 'Enter family status' },
            { key: 'family_income', label: 'Family Income', maxLength: 100, placeholder: 'Enter family income or range' },
        ],
    },
    {
        title: 'Parents',
        fields: [
            { key: 'father_name', label: "Father's Name", maxLength: 255 },
            { key: 'father_occupation', label: "Father's Occupation", maxLength: 255 },
            { key: 'mother_name', label: "Mother's Name", maxLength: 255 },
            { key: 'mother_occupation', label: "Mother's Occupation", maxLength: 255 },
        ],
    },
    {
        title: 'Siblings',
        fields: [
            { key: 'no_of_brothers', label: 'Number of Brothers', numeric: true },
            { key: 'married_brothers', label: 'Married Brothers', numeric: true },
            { key: 'no_of_sisters', label: 'Number of Sisters', numeric: true },
            { key: 'married_sisters', label: 'Married Sisters', numeric: true },
        ],
    },
    {
        title: 'About Family',
        fields: [
            {
                key: 'about_family',
                label: 'Describe Your Family',
                maxLength: 3000,
                multiline: true,
                placeholder: 'Tell others about your family...',
            },
        ],
    },
];

const ALL_FIELDS = GROUPS.flatMap(group => group.fields);
const NUMBER_KEYS = [
    'no_of_brothers',
    'married_brothers',
    'no_of_sisters',
    'married_sisters',
];

function asText(value) {
    return value == null ? '' : String(value);
}

function errorMessage(error) {
    const validation = error?.response?.data?.errors;

    if (validation && typeof validation === 'object') {
        const first = Object.values(validation)[0];

        if (Array.isArray(first) && first.length) {
            return String(first[0]);
        }
    }

    return (
        error?.response?.data?.message ||
        error?.message ||
        'Unable to save family details.'
    );
}

function FormField({ field, value, onChangeText }) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{field.label}</Text>

            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={field.placeholder || field.label}
                placeholderTextColor="#9992A5"
                maxLength={field.numeric ? 2 : field.maxLength}
                keyboardType={field.numeric ? 'number-pad' : 'default'}
                multiline={Boolean(field.multiline)}
                textAlignVertical={field.multiline ? 'top' : 'center'}
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

export default function EditFamilyScreen() {
    const navigation = useNavigation();
    const { user, refreshUser } = useAuth();

    const member = user?.data?.member || user?.member || user || {};

    const initial = useMemo(() => {
        const values = {};

        ALL_FIELDS.forEach(field => {
            values[field.key] = asText(member[field.key]);
        });

        return values;
    }, [
        member?.family_type,
        member?.family_status,
        member?.family_income,
        member?.father_name,
        member?.father_occupation,
        member?.mother_name,
        member?.mother_occupation,
        member?.no_of_brothers,
        member?.married_brothers,
        member?.no_of_sisters,
        member?.married_sisters,
        member?.about_family,
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

        ALL_FIELDS.forEach(field => {
            const before = asText(initial[field.key]).trim();
            const after = asText(form[field.key]).trim();

            if (before !== after) {
                changed[field.key] = after || null;
            }
        });

        if (!Object.keys(changed).length) {
            Alert.alert(
                'No Changes',
                'You have not changed any family details.',
            );
            return;
        }

        for (const key of NUMBER_KEYS) {
            const raw = asText(form[key]).trim();

            if (raw !== '' && (!/^\d+$/.test(raw) || Number(raw) > 20)) {
                Alert.alert(
                    'Invalid Number',
                    'Sibling counts must be whole numbers between 0 and 20.',
                );
                return;
            }

            if (key in changed && changed[key] !== null) {
                changed[key] = Number(raw);
            }
        }

        const brothers = form.no_of_brothers.trim();
        const marriedBrothers = form.married_brothers.trim();
        const sisters = form.no_of_sisters.trim();
        const marriedSisters = form.married_sisters.trim();

        if (
            brothers !== '' &&
            marriedBrothers !== '' &&
            Number(marriedBrothers) > Number(brothers)
        ) {
            Alert.alert(
                'Invalid Details',
                'Married brothers cannot exceed total brothers.',
            );
            return;
        }

        if (
            sisters !== '' &&
            marriedSisters !== '' &&
            Number(marriedSisters) > Number(sisters)
        ) {
            Alert.alert(
                'Invalid Details',
                'Married sisters cannot exceed total sisters.',
            );
            return;
        }

        setSaving(true);
        let saved = false;

        try {
            await updateFamilyProfile(changed);
            saved = true;

            await refreshUser();

            Alert.alert(
                'Family Details Updated',
                'Your family information was saved successfully.',
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
                    'Family details were saved, but refreshing your profile failed.',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack(),
                        },
                    ],
                );
            } else {
                Alert.alert('Unable to Save', errorMessage(error));
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
            keyboardShouldPersistTaps="handled">

            <View style={styles.heading}>
                <Text style={styles.title}>Family Details</Text>
                <Text style={styles.subtitle}>
                    Share information about your family and background.
                </Text>
            </View>

            {GROUPS.map(group => (
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
                        Save Family Details
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
        color: colors.textSecondary,
        marginTop: 7,
        lineHeight: 20,
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
        marginBottom: 19,
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
        minHeight: 115,
        textAlignVertical: 'top',
    },
    counter: {
        fontSize: 11,
        color: colors.textSecondary,
        textAlign: 'right',
        marginTop: 5,
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
