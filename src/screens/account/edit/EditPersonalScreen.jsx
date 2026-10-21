
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
import { updatePersonalProfile } from '../../../api/editProfileApi';
import colors from '../../../theme/colors';

const BLOOD_GROUPS = [
    'A+', 'A-', 'B+', 'B-',
    'AB+', 'AB-', 'O+', 'O-',
];

const MARITAL_STATUSES = [
    'Never Married',
    'Divorced',
    'Widowed',
    'Separated',
];

function asText(value) {
    return value === null || value === undefined
        ? ''
        : String(value);
}

// Laravel accepts YYYY-MM-DD hh:mm AM/PM.
// Existing database values may be YYYY-MM-DD HH:mm:ss.
function formatExistingBirthDate(value) {
    const text = asText(value).trim();

    if (!text) {
        return '';
    }

    if (
        /^\d{4}-\d{2}-\d{2} (0[1-9]|1[0-2]):[0-5]\d (AM|PM)$/i.test(text)
    ) {
        return text;
    }

    const match = text.match(
        /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?/,
    );

    if (!match) {
        return text;
    }

    const hour = Number(match[2]);
    if (hour > 23) {
        return text;
    }

    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;

    return `${match[1]} ${String(hour12).padStart(2, '0')}:${match[3]} ${ampm}`;
}

function validBirthDate(value) {
    const match = value.match(
        /^(\d{4})-(\d{2})-(\d{2}) (0[1-9]|1[0-2]):([0-5]\d) (AM|PM)$/,
    );

    if (!match) {
        return false;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (year < 1900 || month < 1 || month > 12) {
        return false;
    }

    const date = new Date(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

function getErrorMessage(error) {
    const errors = error?.response?.data?.errors;

    if (errors && typeof errors === 'object') {
        const first = Object.values(errors)[0];

        if (Array.isArray(first) && first.length > 0) {
            return String(first[0]);
        }
    }

    return (
        error?.response?.data?.message ||
        error?.message ||
        'Unable to save personal details.'
    );
}

function Field({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    multiline = false,
    hint,
    editable = true,
}) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>

            <TextInput
                value={value}
                onChangeText={onChangeText}
                editable={editable}
                placeholder={placeholder || label}
                placeholderTextColor="#9992A5"
                keyboardType={keyboardType}
                multiline={multiline}
                autoCorrect={false}
                style={[
                    styles.input,
                    multiline && styles.multiline,
                    !editable && styles.readOnly,
                ]}
            />

            {hint ? (
                <Text style={styles.hint}>{hint}</Text>
            ) : null}
        </View>
    );
}

function ChoiceField({
    label,
    value,
    choices,
    onChange,
}) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>

            <View style={styles.choices}>
                {choices.map(choice => {
                    const selected = value === choice;

                    return (
                        <TouchableOpacity
                            key={choice}
                            style={[
                                styles.choice,
                                selected && styles.selectedChoice,
                            ]}
                            onPress={() =>
                                onChange(selected ? '' : choice)
                            }>
                            <Text
                                style={[
                                    styles.choiceText,
                                    selected && styles.selectedChoiceText,
                                ]}>
                                {choice}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {value && !choices.includes(value) ? (
                <Text style={styles.hint}>
                    Current value: {value}
                </Text>
            ) : null}
        </View>
    );
}

export default function EditPersonalScreen() {
    const navigation = useNavigation();

    const { user, refreshUser } = useAuth();
    const member = user?.data?.member || user?.member || user;

    const initial = useMemo(() => ({
        birth_date_time: formatExistingBirthDate(
            member?.birth_date_time,
        ),
        birth_place: asText(member?.birth_place),
        height: asText(member?.height),
        blood_group: asText(member?.blood_group),
        marital_status: asText(member?.marital_status),
        no_of_child: asText(member?.no_of_child),
        health_info: asText(member?.health_info),
    }), [
        member?.birth_date_time,
        member?.birth_place,
        member?.height,
        member?.blood_group,
        member?.marital_status,
        member?.no_of_child,
        member?.health_info,
    ]);

    const [form, setForm] = useState(initial);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm(initial);
    }, [initial]);

    const update = (key, value) => {
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
            const oldValue = asText(initial[key]).trim();
            const newValue = asText(form[key]).trim();

            if (oldValue !== newValue) {
                changed[key] = newValue || null;
            }
        });

        if (Object.keys(changed).length === 0) {
            Alert.alert(
                'No Changes',
                'You have not changed any details.',
            );
            return;
        }

        if ('birth_date_time' in changed && changed.birth_date_time) {
            if (!validBirthDate(changed.birth_date_time)) {
                Alert.alert(
                    'Invalid Date',
                    'Use YYYY-MM-DD hh:mm AM/PM, for example 1996-05-20 08:30 AM.',
                );
                return;
            }
        }

        if ('height' in changed && changed.height) {
            const heightMatch = changed.height.match(
                /^(\d+)ft\s(\d+)in$/,
            );

            if (
                !heightMatch ||
                Number(heightMatch[1]) < 3 ||
                Number(heightMatch[1]) > 8 ||
                Number(heightMatch[2]) > 11
            ) {
                Alert.alert(
                    'Invalid Height',
                    'Enter height like 5ft 6in.',
                );
                return;
            }
        }

        if (
            'no_of_child' in changed &&
            changed.no_of_child !== null
        ) {
            const count = Number(changed.no_of_child);

            if (
                !Number.isInteger(count) ||
                count < 0 ||
                count > 20
            ) {
                Alert.alert(
                    'Invalid Value',
                    'Number of children must be between 0 and 20.',
                );
                return;
            }

            changed.no_of_child = count;
        }

        setSaving(true);

        try {
            await updatePersonalProfile(changed);
            await refreshUser();

            Alert.alert(
                'Profile Updated',
                'Your personal details were saved successfully.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ],
            );
        } catch (error) {
            Alert.alert(
                'Unable to save',
                getErrorMessage(error),
            );
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
                <Text style={styles.title}>Personal Details</Text>
                <Text style={styles.subtitle}>
                    Update your personal information.
                </Text>
            </View>

            <View style={styles.card}>
                <Field
                    label="Gender"
                    value={asText(member?.gender)}
                    editable={false}
                    hint="Gender changes are not available in this form."
                />

                <Field
                    label="Date & Time of Birth"
                    value={form.birth_date_time}
                    onChangeText={value =>
                        update('birth_date_time', value)
                    }
                    placeholder="1996-05-20 08:30 AM"
                    hint="Format: YYYY-MM-DD hh:mm AM/PM"
                />

                <Field
                    label="Place of Birth"
                    value={form.birth_place}
                    onChangeText={value =>
                        update('birth_place', value)
                    }
                    placeholder="e.g. Kangra"
                />

                <Field
                    label="Height"
                    value={form.height}
                    onChangeText={value =>
                        update('height', value)
                    }
                    placeholder="5ft 6in"
                    hint="Example: 5ft 6in"
                />

                <ChoiceField
                    label="Blood Group"
                    value={form.blood_group}
                    choices={BLOOD_GROUPS}
                    onChange={value =>
                        update('blood_group', value)
                    }
                />

                <ChoiceField
                    label="Marital Status"
                    value={form.marital_status}
                    choices={MARITAL_STATUSES}
                    onChange={value =>
                        update('marital_status', value)
                    }
                />

                <Field
                    label="Number of Children"
                    value={form.no_of_child}
                    keyboardType="number-pad"
                    onChangeText={value =>
                        update('no_of_child', value)
                    }
                    placeholder="0"
                />

                <Field
                    label="Health Information"
                    value={form.health_info}
                    onChangeText={value =>
                        update('health_info', value)
                    }
                    placeholder="Any health information you wish to share"
                    multiline
                />
            </View>

            <TouchableOpacity
                style={[
                    styles.saveButton,
                    saving && styles.disabledButton,
                ]}
                onPress={handleSave}
                disabled={saving}>

                {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.saveText}>
                        Save Personal Details
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
        paddingBottom: 35,
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
        marginTop: 7,
        fontSize: 13,
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
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E0EC',
        borderRadius: 11,
        color: colors.text,
        fontSize: 14,
        paddingHorizontal: 13,
        paddingVertical: 13,
    },
    readOnly: {
        backgroundColor: '#F5F3F8',
        color: colors.textSecondary,
    },
    multiline: {
        height: 110,
        textAlignVertical: 'top',
    },
    hint: {
        marginTop: 7,
        fontSize: 11,
        color: colors.textSecondary,
    },
    choices: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 9,
    },
    choice: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E5E0EC',
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
    },
    selectedChoice: {
        backgroundColor: '#EFE9FF',
        borderColor: colors.primary,
    },
    choiceText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    selectedChoiceText: {
        color: colors.primary,
        fontWeight: '700',
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
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});
