
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StyleSheet,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { changePassword } from '../../../api/accountSettingsApi';
import colors from '../../../theme/colors';

function PasswordInput({ label, value, onChangeText }) {
    const [visible, setVisible] = useState(false);

    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={!visible}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    placeholderTextColor="#9992A5"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                />

                <TouchableOpacity
                    onPress={() => setVisible(previous => !previous)}
                    style={styles.showButton}>
                    <Text style={styles.showText}>
                        {visible ? 'Hide' : 'Show'}
                    </Text>
                </TouchableOpacity>
            </View>
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
        'Unable to change password.'
    );
}

export default function ChangePasswordScreen() {
    const navigation = useNavigation();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (saving) {
            return;
        }

        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Required Fields', 'Please fill in all password fields.');
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert('Invalid Password', 'New password must be at least 8 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Password Mismatch', 'New passwords do not match.');
            return;
        }

        if (currentPassword === newPassword) {
            Alert.alert('Invalid Password', 'Choose a different new password.');
            return;
        }

        setSaving(true);

        try {
            await changePassword({
                currentPassword,
                newPassword,
                confirmPassword,
            });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            Alert.alert(
                'Password Updated',
                'Your password has been changed successfully.',
                [{ text: 'OK', onPress: () => navigation.goBack() }],
            );
        } catch (error) {
            Alert.alert('Unable to Change Password', getErrorMessage(error));
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">

            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.subtitle}>
                Update your password to keep your account secure.
            </Text>

            <View style={styles.card}>
                <PasswordInput
                    label="Current Password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                />

                <PasswordInput
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                />

                <PasswordInput
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />

                <Text style={styles.hint}>
                    Your new password must contain at least 8 characters.
                </Text>
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
                    <Text style={styles.saveText}>Change Password</Text>
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
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
    },
    subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 7,
        marginBottom: 20,
        lineHeight: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EEEAF7',
        borderRadius: 16,
        padding: 17,
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
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E0EC',
        borderRadius: 11,
        backgroundColor: '#FFFFFF',
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 13,
        color: colors.text,
        fontSize: 14,
    },
    showButton: {
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    showText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    hint: {
        color: colors.textSecondary,
        fontSize: 12,
        lineHeight: 19,
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
