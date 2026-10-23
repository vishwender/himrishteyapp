import AppIcon from '../../components/AppIcon';

import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    StyleSheet,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import {
    getWallet,
    getMemberships,
    getMembershipPlans,
    requestMembershipCallback,
} from '../../api/membershipWalletApi';

import colors from '../../theme/colors';

const formatMoney = value => {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value ?? '—');

    return `₹${number.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const errorMessage = error =>
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong.';

export default function MembershipWalletScreen() {
    const navigation = useNavigation();

    const [wallet, setWallet] = useState(null);
    const [memberships, setMemberships] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [plans, setPlans] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [callbackLoading, setCallbackLoading] = useState(false);

    const loadData = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true);
        else setLoading(true);

        const [walletResult, membershipsResult] =
            await Promise.allSettled([
                getWallet(),
                getMemberships(),
            ]);

        const failures = [];

        if (walletResult.status === 'fulfilled') {
            setWallet(walletResult.value);
        } else {
            failures.push('Wallet: ' + errorMessage(walletResult.reason));
        }

        if (membershipsResult.status === 'fulfilled') {
            setMemberships(
                Array.isArray(membershipsResult.value)
                    ? membershipsResult.value
                    : [],
            );
        } else {
            failures.push(
                'Memberships: ' + errorMessage(membershipsResult.reason),
            );
        }

        setLoading(false);
        setRefreshing(false);

        if (failures.length) {
            Alert.alert('Unable to Load Some Details', failures.join('\n'));
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData]),
    );

    const openPlans = async membership => {
        if (loadingPlans) return;

        if (selectedType === membership.id) {
            setSelectedType(null);
            setPlans([]);
            return;
        }

        setSelectedType(membership.id);
        setPlans([]);
        setLoadingPlans(true);

        try {
            const result = await getMembershipPlans(membership.id);
            setPlans(Array.isArray(result?.plans) ? result.plans : []);
        } catch (error) {
            Alert.alert('Unable to Load Plans', errorMessage(error));
        } finally {
            setLoadingPlans(false);
        }
    };

    const sendCallback = () => {
        if (callbackLoading) return;

        Alert.alert(
            'Request a Callback',
            'Would you like the HimRishtey team to contact you about membership plans?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Request Callback',
                    onPress: async () => {
                        setCallbackLoading(true);

                        try {
                            await requestMembershipCallback();
                            Alert.alert(
                                'Request Sent',
                                'Your callback request was submitted successfully.',
                            );
                        } catch (error) {
                            Alert.alert(
                                'Unable to Request Callback',
                                errorMessage(error),
                            );
                        } finally {
                            setCallbackLoading(false);
                        }
                    },
                },
            ],
        );
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => loadData(true)}
                    colors={[colors.primary]}
                />
            }>

            <Text style={styles.title}>Membership & Wallet</Text>
            <Text style={styles.subtitle}>
                Manage your wallet and explore membership plans.
            </Text>

            <View style={styles.walletCard}>
                <Text style={styles.walletLabel}>Available Wallet Balance</Text>

                {loading && !wallet ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.balance}>
                        {wallet ? formatMoney(wallet.balance) : 'Unavailable'}
                    </Text>
                )}

                <Text style={styles.walletHint}>
                    {wallet?.currency || 'INR'} Wallet
                </Text>

                <TouchableOpacity
                    style={styles.walletAction}
                    onPress={() => navigation.navigate('WalletTransactions')}>
                    <Text style={styles.walletActionText}>
                        View Transactions →
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Membership Plans</Text>

                <Text style={styles.helper}>
                    Explore the membership options available for HimRishtey.
                </Text>

                {loading ? (
                    <ActivityIndicator color={colors.primary} />
                ) : memberships.length === 0 ? (
                    <Text style={styles.empty}>No membership plans available.</Text>
                ) : (
                    memberships.map(item => (
                        <View key={String(item.id)} style={styles.membership}>
                            <TouchableOpacity
                                onPress={() => openPlans(item)}
                                style={styles.membershipHeader}
                                disabled={loadingPlans}>
                                <View style={styles.flex}>
                                    <Text style={styles.membershipName}>
                                        {item.name}
                                    </Text>
                                    {item.plan_guide ? (
                                        <Text style={styles.helper}>
                                            {item.plan_guide}
                                        </Text>
                                    ) : null}
                                </View>

                                <AppIcon name={selectedType === item.id ? 'collapse' : 'expand'} style={styles.arrow} />
                            </TouchableOpacity>

                            {selectedType === item.id ? (
                                <View style={styles.plansBox}>
                                    {item.plan_description ? (
                                        <Text style={styles.helper}>
                                            {item.plan_description}
                                        </Text>
                                    ) : null}

                                    {loadingPlans ? (
                                        <ActivityIndicator color={colors.primary} />
                                    ) : plans.length === 0 ? (
                                        <Text style={styles.empty}>
                                            No plans available for this membership.
                                        </Text>
                                    ) : (
                                        plans.map(plan => (
                                            <View key={String(plan.id)} style={styles.planCard}>
                                                <Text style={styles.planName}>
                                                    {plan.plan_name}
                                                </Text>

                                                <Text style={styles.planPrice}>
                                                    {formatMoney(plan.final_cost)}
                                                </Text>

                                                {Number(plan.discount_percentage) > 0 ? (
                                                    <Text style={styles.discount}>
                                                        {plan.discount_percentage}% discount
                                                        {' · '}Regular price: {formatMoney(plan.plan_cost)}
                                                    </Text>
                                                ) : null}

                                                <Text style={styles.planDetail}>
                                                    Duration: {plan.duration_days} days
                                                </Text>

                                                <Text style={styles.planDetail}>
                                                    Contact views: {plan.view_contact}
                                                </Text>

                                                <Text style={styles.planDetail}>
                                                    Profile views: {plan.view_profile}
                                                </Text>
                                            </View>
                                        ))
                                    )}

                                    {item.terms_and_conditions ? (
                                        <Text style={styles.terms}>
                                            Terms: {item.terms_and_conditions}
                                        </Text>
                                    ) : null}
                                </View>
                            ) : null}
                        </View>
                    ))
                )}
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Need Help Choosing?</Text>
                <Text style={styles.helper}>
                    Request a callback to discuss membership options.
                </Text>

                <TouchableOpacity
                    style={styles.callbackButton}
                    disabled={callbackLoading}
                    onPress={sendCallback}>
                    {callbackLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.callbackText}>
                            Request a Callback
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <Text style={styles.footer}>
                Online payment options will be available after payment
                verification testing is complete.
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAF9FF' },
    content: { padding: 16, paddingBottom: 40 },
    title: { fontSize: 24, fontWeight: '800', color: colors.text },
    subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 6,
        marginBottom: 20,
    },
    walletCard: {
        backgroundColor: '#34205D',
        borderRadius: 18,
        padding: 22,
        marginBottom: 18,
    },
    walletLabel: { color: '#E1D8F2', fontSize: 13 },
    balance: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '800',
        marginTop: 13,
    },
    walletHint: { color: '#E1D8F2', marginTop: 6 },
    walletAction: {
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        padding: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    walletActionText: { color: '#34205D', fontWeight: '800' },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EEEAF7',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 10,
    },
    helper: {
        color: colors.textSecondary,
        fontSize: 12,
        lineHeight: 19,
        marginTop: 4,
        marginBottom: 9,
    },
    empty: { color: colors.textSecondary, paddingVertical: 14 },
    membership: {
        borderWidth: 1,
        borderColor: '#E9E3F0',
        borderRadius: 12,
        marginTop: 11,
        overflow: 'hidden',
    },
    membershipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    flex: { flex: 1 },
    membershipName: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.text,
    },
    arrow: {
        fontSize: 24,
        color: colors.primary,
        paddingHorizontal: 6,
    },
    plansBox: { padding: 12, backgroundColor: '#FAF9FF' },
    planCard: {
        padding: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EEEAF7',
        borderRadius: 12,
        marginBottom: 10,
    },
    planName: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.text,
    },
    planPrice: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.primary,
        marginVertical: 9,
    },
    discount: { color: '#20834A', fontSize: 12, marginBottom: 8 },
    planDetail: {
        color: colors.textSecondary,
        fontSize: 12,
        marginTop: 5,
    },
    terms: {
        color: colors.textSecondary,
        fontSize: 11,
        lineHeight: 17,
        marginTop: 10,
    },
    callbackButton: {
        backgroundColor: colors.primary,
        borderRadius: 11,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 8,
    },
    callbackText: { color: '#FFFFFF', fontWeight: '800' },
    footer: {
        color: colors.textSecondary,
        textAlign: 'center',
        fontSize: 11,
        lineHeight: 18,
    },
});
