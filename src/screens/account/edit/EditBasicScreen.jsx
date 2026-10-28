
import React, { useEffect, useState } from 'react';

import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StyleSheet,
    Keyboard,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../../context/AuthContext';
import { updateBasicProfile } from '../../../api/editProfileApi';
import colors from '../../../theme/colors';

function FormField({
    label,
    value,
    onChangeText,
    keyboardType = 'default',
    editable = true,
    hint,
}) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>

            <TextInput
                style={[
                    styles.input,
                    !editable && styles.readonlyInput,
                ]}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                editable={editable}
                autoCorrect={false}
                placeholder={`Enter ${label.toLowerCase()}`}
                placeholderTextColor="#96909F"
            />

            {hint ? (
                <Text style={styles.hint}>{hint}</Text>
            ) : null}
        </View>
    );
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
        'Unable to update your profile.'
    );
}

export default function EditBasicScreen() {
    const navigation = useNavigation();
    const { user, refreshUser } = useAuth();

    const member = user?.data?.member || user?.member || user;

    const [fullName, setFullName] = useState('');
    const [alternateNumber, setAlternateNumber] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setFullName(String(member?.full_name ?? ''));
        setAlternateNumber(String(member?.alternate_number ?? ''));
        setWhatsappNumber(String(member?.whatsapp_number ?? ''));
    }, [
        member?.full_name,
        member?.alternate_number,
        member?.whatsapp_number,
    ]);

    const handleSave = async () => {
        if (saving) {
            return;
        }

        Keyboard.dismiss();

        const name = fullName.trim();

        if (!name) {
            Alert.alert(
                'Validation',
                'Please enter your full name.',
            );
            return;
        }

        const payload = {
            full_name: name,
            alternate_number: alternateNumber.trim() || null,
            whatsapp_number: whatsappNumber.trim() || null,
        };

        setSaving(true);

        try {
            await updateBasicProfile(payload);

            // Refresh the authenticated member across the app.
            await refreshUser();

            Alert.alert(
                'Profile Updated',
                'Your basic details have been saved successfully.',
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
                <Text style={styles.title}>Basic Details</Text>

                <Text style={styles.subtitle}>
                    Keep your basic profile information up to date.
                </Text>
            </View>

            <View style={styles.card}>
                <FormField
                    label="Profile ID"
                    value={String(member?.profile_id ?? '')}
                    editable={false}
                    hint="Your Profile ID cannot be changed."
                />

                <FormField
                    label="Full Name"
                    value={fullName}
                    onChangeText={setFullName}
                />

                <FormField
                    label="Email"
                    value={String(member?.email ?? '')}
                    editable={false}
                    hint="Email changes are not available here."
                />

                <FormField
                    label="Mobile Number"
                    value={String(member?.mobile_number ?? '')}
                    editable={false}
                    hint="Mobile number changes require a separate verified flow."
                />

                <FormField
                    label="Alternate Number"
                    value={alternateNumber}
                    onChangeText={setAlternateNumber}
                    keyboardType="phone-pad"
                />

                <FormField
                    label="WhatsApp Number"
                    value={whatsappNumber}
                    onChangeText={setWhatsappNumber}
                    keyboardType="phone-pad"
                />
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
                    <Text style={styles.saveText}>Save Changes</Text>
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
        fontSize: 25,
        fontWeight: '800',
        color: colors.title,
    },
    subtitle: {
        marginTop: 6,
        fontSize: 13,
        color: colors.textSecondary,
    },
    card: {
        marginTop: 12,
        padding: 17,
        backgroundColor: '#FFFFFF',
        borderRadius: 17,
        borderWidth: 1,
        borderColor: '#EEEAF7',
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
        borderColor: '#E6E1ED',
        borderRadius: 11,
        paddingHorizontal: 13,
        paddingVertical: 12,
        color: colors.text,
        fontSize: 14,
        backgroundColor: '#FFFFFF',
    },
    readonlyInput: {
        backgroundColor: '#F5F3F8',
        color: colors.textSecondary,
    },
    hint: {
        fontSize: 11,
        marginTop: 6,
        color: colors.textSecondary,
    },
    saveButton: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
        alignItems: 'center',
    },
    saveText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
    disabledButton: {
        opacity: 0.6,
    },
});
