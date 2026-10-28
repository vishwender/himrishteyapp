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

import { useFocusEffect } from '@react-navigation/native';

import {
    getMemberships,
    getMembershipPlans,
} from '../../api/membershipWalletApi';

import colors from '../../theme/colors';

function money(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return '—';
    }

    return `₹${amount.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
    })}`;
}

function errorText(error) {
    return (
        error?.response?.data?.message ||
        error?.message ||
        'Unable to load membership plans.'
    );
}

export default function MembershipScreen() {
    const [memberships, setMemberships] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [plansByType, setPlansByType] = useState({});
    const [loadingType, setLoadingType] = useState(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadMemberships = useCallback(async (refresh = false) => {
        if (refresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const response = await getMemberships();

            setMemberships(
                Array.isArray(response) ? response : [],
            );

            setError('');
        } catch (err) {
            setError(errorText(err));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadMemberships();
        }, [loadMemberships]),
    );

    const togglePlans = async membership => {
        const id = membership.id;

        if (loadingType !== null) {
            return;
        }

        if (selectedType === id) {
            setSelectedType(null);
            return;
        }

        setSelectedType(id);

        if (plansByType[id]) {
            return;
        }

        setLoadingType(id);

        try {
            const response = await getMembershipPlans(id);

            setPlansByType(previous => ({
                ...previous,
                [id]: Array.isArray(response?.plans)
                    ? response.plans
                    : [],
            }));
        } catch (err) {
            setError(errorText(err));
        } finally {
            setLoadingType(null);
        }
    };

    const onRefresh = async () => {
        setPlansByType({});
        setSelectedType(null);
        await loadMemberships(true);
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[colors.primary]}
                />
            }>

            <Text style={styles.title}>Membership Plans</Text>

            <Text style={styles.subtitle}>
                Explore available HimShaadi membership plans
                and their benefits.
            </Text>

            {loading ? (
                <ActivityIndicator
                    color={colors.primary}
                    size="large"
                    style={styles.loader}
                />
            ) : (
                <>
                    {error ? (
                        <Text style={styles.error}>{error}</Text>
                    ) : null}

                    {memberships.length === 0 ? (
                        <Text style={styles.empty}>
                            No membership plans are currently available.
                        </Text>
                    ) : (
                        memberships.map(membership => {
                            const expanded =
                                selectedType === membership.id;

                            const plans =
                                plansByType[membership.id] || [];

                            return (
                                <View
                                    key={String(membership.id)}
                                    style={styles.card}>

                                    <TouchableOpacity
                                        style={styles.typeHeader}
                                        onPress={() => togglePlans(membership)}>

                                        <View style={styles.typeInfo}>
                                            <Text style={styles.typeName}>
                                                {membership.name}
                                            </Text>

                                            {membership.plan_guide ? (
                                                <Text style={styles.typeDescription}>
                                                    {membership.plan_guide}
                                                </Text>
                                            ) : null}
                                        </View>

                                        <AppIcon name={expanded ? 'collapse' : 'expand'} style={styles.expandIcon} />
                                    </TouchableOpacity>

                                    {expanded ? (
                                        <View style={styles.expandedContent}>

                                            {membership.plan_description ? (
                                                <Text style={styles.description}>
                                                    {membership.plan_description}
                                                </Text>
                                            ) : null}

                                            {loadingType === membership.id ? (
                                                <ActivityIndicator
                                                    color={colors.primary}
                                                    style={styles.loader}
                                                />
                                            ) : plans.length === 0 ? (
                                                <Text style={styles.empty}>
                                                    No plans available.
                                                </Text>
                                            ) : (
                                                plans.map(plan => (
                                                    <View
                                                        key={String(plan.id)}
                                                        style={styles.planCard}>

                                                        <Text style={styles.planName}>
                                                            {plan.plan_name}
                                                        </Text>

                                                        <View style={styles.priceRow}>
                                                            <Text style={styles.price}>
                                                                {money(plan.final_cost)}
                                                            </Text>

                                                            {Number(plan.discount_percentage) > 0 ? (
                                                                <Text style={styles.discount}>
                                                                    {plan.discount_percentage}% OFF
                                                                </Text>
                                                            ) : null}
                                                        </View>

                                                        {Number(plan.discount_percentage) > 0 ? (
                                                            <Text style={styles.originalPrice}>
                                                                Regular price: {money(plan.plan_cost)}
                                                            </Text>
                                                        ) : null}

                                                        <View style={styles.divider} />

                                                        <View style={styles.detailRow}>
                                                            <Text style={styles.detailLabel}>
                                                                Duration
                                                            </Text>

                                                            <Text style={styles.detailValue}>
                                                                {plan.duration_days} days
                                                            </Text>
                                                        </View>

                                                        <View style={styles.detailRow}>
                                                            <Text style={styles.detailLabel}>
                                                                Contact Views
                                                            </Text>

                                                            <Text style={styles.detailValue}>
                                                                {plan.view_contact}
                                                            </Text>
                                                        </View>

                                                        <View style={styles.detailRow}>
                                                            <Text style={styles.detailLabel}>
                                                                Profile Views
                                                            </Text>

                                                            <Text style={styles.detailValue}>
                                                                {plan.view_profile}
                                                            </Text>
                                                        </View>
                                                        <TouchableOpacity
                                                            accessibilityRole="button"
                                                            accessibilityLabel={`Buy ${plan.plan_name}`}
                                                            style={styles.buyButton}
                                                            onPress={() => Alert.alert(
                                                                'Buy Membership',
                                                                `You selected ${plan.plan_name}. Online purchasing is not available yet.`,
                                                            )}>
                                                            <Text style={styles.buyButtonText}>Buy</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                ))
                                            )}

                                            {membership.terms_and_conditions ? (
                                                <Text style={styles.terms}>
                                                    Terms & Conditions:
                                                    {'\n'}{membership.terms_and_conditions}
                                                </Text>
                                            ) : null}
                                        </View>
                                    ) : null}
                                </View>
                            );
                        })
                    )}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    buyButton: {
        backgroundColor: colors.primary,
        borderRadius: 11,
        paddingVertical: 14,
        minHeight: 48,
        alignItems: 'center',
        marginTop: 16,
    },
    buyButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    container: {
        flex: 1,
        backgroundColor: '#FAF9FF',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    title: {
        fontSize: 25,
        fontWeight: '800',
        color: colors.title,
    },
    subtitle: {
        marginTop: 7,
        marginBottom: 20,
        fontSize: 13,
        lineHeight: 20,
        color: colors.textSecondary,
    },
    loader: {
        marginVertical: 25,
    },
    error: {
        color: '#C43B4B',
        marginBottom: 15,
        fontSize: 13,
    },
    empty: {
        color: colors.textSecondary,
        textAlign: 'center',
        paddingVertical: 22,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EEEAF7',
        marginBottom: 14,
        overflow: 'hidden',
    },
    typeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 17,
    },
    typeInfo: {
        flex: 1,
    },
    typeName: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.text,
    },
    typeDescription: {
        fontSize: 12,
        lineHeight: 19,
        color: colors.textSecondary,
        marginTop: 6,
    },
    expandIcon: {
        fontSize: 25,
        color: colors.primary,
        marginLeft: 12,
    },
    expandedContent: {
        backgroundColor: '#FAF9FF',
        padding: 13,
    },
    description: {
        fontSize: 12,
        lineHeight: 19,
        color: colors.textSecondary,
        marginBottom: 13,
    },
    planCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EEEAF7',
        borderRadius: 13,
        padding: 16,
        marginBottom: 12,
    },
    planName: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.text,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 12,
    },
    price: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.primary,
    },
    discount: {
        fontSize: 11,
        fontWeight: '800',
        color: '#20834A',
        backgroundColor: '#E8F7EF',
        borderRadius: 6,
        paddingHorizontal: 9,
        paddingVertical: 5,
    },
    originalPrice: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 6,
    },
    divider: {
        height: 1,
        backgroundColor: '#EEEAF7',
        marginVertical: 14,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
    },
    terms: {
        fontSize: 11,
        lineHeight: 18,
        color: colors.textSecondary,
        marginTop: 10,
    },
});
