import AppIcon from '../../../components/AppIcon';

import React, { useCallback, useState } from 'react';

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

import { useFocusEffect } from '@react-navigation/native';

import {
    getDeleteAccountRequests,
    submitDeleteAccountRequest,
} from '../../../api/accountSettingsApi';

import colors from '../../../theme/colors';

const REASONS = [
    'Found a partner',
    'Not satisfied with the service',
    'Privacy concerns',
    'Not using HimShaadi anymore',
    'Other',
];

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
        'Something went wrong.'
    );
}

export default function DeleteAccountScreen() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [reason, setReason] = useState('');
    const [otherReason, setOtherReason] = useState('');
    const [confirmed, setConfirmed] = useState(false);

    const pendingRequest = requests.find(
        item => Number(item.status) === 0,
    );

    const latestRequest = requests[0] || null;

    const loadRequests = useCallback(async () => {
        setLoading(true);

        try {
            const result = await getDeleteAccountRequests();

            setRequests(
                Array.isArray(result) ? result : [],
            );
        } catch (error) {
            Alert.alert(
                'Unable to Load Requests',
                getErrorMessage(error),
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadRequests();
        }, [loadRequests]),
    );

    const handleSubmit = () => {
        if (saving || pendingRequest) {
            return;
        }

        if (!reason) {
            Alert.alert(
                'Select Reason',
                'Please select your reason for leaving.',
            );
            return;
        }

        if (!confirmed) {
            Alert.alert(
                'Confirmation Required',
                'Please confirm that you want to submit a deletion request.',
            );
            return;
        }

        const finalReason =
            reason === 'Other'
                ? otherReason.trim() || 'Other'
                : reason;

        if (finalReason.length > 5000) {
            Alert.alert(
                'Reason Too Long',
                'Your reason must not exceed 5,000 characters.',
            );
            return;
        }

        Alert.alert(
            'Submit Account Deletion Request?',
            'Your request will be sent for processing. Your account will not be deleted immediately.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Submit Request',
                    style: 'destructive',
                    onPress: () => sendRequest(finalReason),
                },
            ],
        );
    };

    const sendRequest = async finalReason => {
        if (saving) {
            return;
        }

        setSaving(true);

        try {
            const result =
                await submitDeleteAccountRequest(finalReason);

            setRequests(previous => [
                result,
                ...previous.filter(
                    item => item.id !== result.id,
                ),
            ]);

            setConfirmed(false);

            Alert.alert(
                'Request Submitted',
                'Your account deletion request has been submitted successfully.',
            );
        } catch (error) {
            if (error?.response?.status === 409) {
                Alert.alert(
                    'Request Already Pending',
                    'You already have a pending account deletion request.',
                );

                // Refresh the actual request from the server.
                await loadRequests();
            } else {
                Alert.alert(
                    'Unable to Submit Request',
                    getErrorMessage(error),
                );
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator
                    size="large"
                    color={colors.primary}
                />
                <Text style={styles.loadingText}>
                    Checking deletion request status...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            <Text style={styles.title}>Delete Account</Text>

            <Text style={styles.subtitle}>
                Request deletion of your HimShaadi account.
            </Text>

            {pendingRequest ? (
                <View style={styles.pendingCard}>
                    <Text style={styles.pendingTitle}>
                        Request Pending
                    </Text>

                    <Text style={styles.infoText}>
                        You have already submitted an account
                        deletion request.
                    </Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                            Request ID
                        </Text>
                        <Text style={styles.detailValue}>
                            #{pendingRequest.id}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                            Submitted
                        </Text>
                        <Text style={styles.detailValue}>
                            {pendingRequest.date || 'Unavailable'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                            Status
                        </Text>
                        <Text style={styles.pendingStatus}>
                            Pending
                        </Text>
                    </View>

                    {pendingRequest.reason ? (
                        <View style={styles.reasonBox}>
                            <Text style={styles.detailLabel}>
                                Your Reason
                            </Text>

                            <Text style={styles.reasonText}>
                                {pendingRequest.reason}
                            </Text>
                        </View>
                    ) : null}
                </View>
            ) : (
                <>
                    {latestRequest ? (
                        <View style={styles.historyCard}>
                            <Text style={styles.historyTitle}>
                                Previous Request
                            </Text>

                            <Text style={styles.infoText}>
                                Request #{latestRequest.id} — Status code:
                                {' '}{latestRequest.status}
                            </Text>

                            <Text style={styles.infoText}>
                                {latestRequest.date || ''}
                            </Text>
                        </View>
                    ) : null}

                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>
                            Before You Continue
                        </Text>

                        <Text style={styles.infoText}>
                            If you simply want to stop receiving
                            matrimonial matches, you can hide
                            your profile using Profile Visibility.
                        </Text>

                        <Text style={styles.infoText}>
                            Submitting this request does not
                            immediately delete your profile.
                            Your request will need to be processed.
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>
                            Why Are You Leaving?
                        </Text>

                        {REASONS.map(item => {
                            const selected = reason === item;

                            return (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.reasonOption,
                                        selected && styles.selectedOption,
                                    ]}
                                    onPress={() => {
                                        setReason(item);
                                        setConfirmed(false);
                                    }}
                                    activeOpacity={0.8}>

                                    <View
                                        style={[
                                            styles.radio,
                                            selected && styles.radioSelected,
                                        ]}>
                                        {selected ? (
                                            <View style={styles.radioInner} />
                                        ) : null}
                                    </View>

                                    <Text style={styles.optionText}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}

                        {reason === 'Other' ? (
                            <View style={styles.otherBox}>
                                <Text style={styles.label}>
                                    Additional Details (Optional)
                                </Text>

                                <TextInput
                                    style={styles.textarea}
                                    value={otherReason}
                                    onChangeText={setOtherReason}
                                    placeholder="Tell us more..."
                                    placeholderTextColor="#9992A5"
                                    multiline
                                    maxLength={5000}
                                    textAlignVertical="top"
                                />

                                <Text style={styles.counter}>
                                    {otherReason.length} / 5000
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    <TouchableOpacity
                        style={styles.confirmRow}
                        activeOpacity={0.8}
                        onPress={() =>
                            setConfirmed(previous => !previous)
                        }>

                        <View
                            style={[
                                styles.checkbox,
                                confirmed && styles.checkboxSelected,
                            ]}>
                            {confirmed ? (
                                <AppIcon name="check" style={styles.checkmark} />
                            ) : null}
                        </View>

                        <Text style={styles.confirmText}>
                            I understand that this will submit
                            an account deletion request.
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.deleteButton,
                            (!reason || !confirmed || saving) &&
                            styles.disabledButton,
                        ]}
                        onPress={handleSubmit}
                        disabled={!reason || !confirmed || saving}>

                        {saving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.deleteButtonText}>
                                Request Account Deletion
                            </Text>
                        )}
                    </TouchableOpacity>
                </>
            )}
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
        paddingBottom: 45,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FAF9FF',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 13,
        color: colors.textSecondary,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
    },
    subtitle: {
        marginTop: 7,
        marginBottom: 20,
        fontSize: 13,
        lineHeight: 20,
        color: colors.textSecondary,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EEEAF7',
        padding: 17,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 17,
    },
    infoCard: {
        backgroundColor: '#F0EAFE',
        borderRadius: 13,
        padding: 16,
        marginBottom: 18,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 9,
    },
    infoText: {
        fontSize: 13,
        lineHeight: 21,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    reasonOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 13,
        borderWidth: 1,
        borderColor: '#E5E0EC',
        borderRadius: 11,
        marginBottom: 10,
    },
    selectedOption: {
        backgroundColor: '#F3EFFF',
        borderColor: colors.primary,
    },
    radio: {
        width: 21,
        height: 21,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#BEB6CC',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    radioSelected: {
        borderColor: colors.primary,
    },
    radioInner: {
        width: 11,
        height: 11,
        borderRadius: 6,
        backgroundColor: colors.primary,
    },
    optionText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
    },
    otherBox: {
        marginTop: 10,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 9,
    },
    textarea: {
        minHeight: 110,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E0EC',
        borderRadius: 11,
        padding: 13,
        color: colors.text,
        fontSize: 14,
    },
    counter: {
        marginTop: 6,
        textAlign: 'right',
        fontSize: 11,
        color: colors.textSecondary,
    },
    confirmRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 18,
    },
    checkbox: {
        height: 22,
        width: 22,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#BEB6CC',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checkboxSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    checkmark: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    confirmText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
        color: colors.text,
    },
    deleteButton: {
        backgroundColor: '#C43B4B',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
    disabledButton: {
        opacity: 0.5,
    },
    pendingCard: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EBCB87',
        backgroundColor: '#FFF9EB',
        padding: 18,
    },
    pendingTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#956100',
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    detailLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    detailValue: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text,
    },
    pendingStatus: {
        color: '#956100',
        fontSize: 12,
        fontWeight: '800',
    },
    reasonBox: {
        marginTop: 18,
    },
    reasonText: {
        color: colors.text,
        fontSize: 13,
        lineHeight: 20,
        marginTop: 5,
    },
    historyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 13,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EEEAF7',
        marginBottom: 16,
    },
    historyTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 8,
    },
});
