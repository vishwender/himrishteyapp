import AppIcon from '../../components/AppIcon';
import WalletAmountModal from '../../components/WalletAmountModal';

import React, { useCallback, useState } from 'react';

import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    RefreshControl,
    StyleSheet,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import {
    getWallet,
    getWalletTransactions,
    getWalletOffers,
} from '../../api/membershipWalletApi';

import colors from '../../theme/colors';

function formatMoney(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return '—';
    }

    return `₹${number.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function getErrorMessage(error) {
    return (
        error?.response?.data?.message ||
        error?.message ||
        'Unable to load wallet details.'
    );
}

export default function WalletScreen() {
    const [amountModalVisible, setAmountModalVisible] = useState(false);
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [offers, setOffers] = useState([]);
    const [offersError, setOffersError] = useState('');

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');


    const loadData = useCallback(async (refresh = false) => {
        if (refresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const results = await Promise.allSettled([
                getWallet(),
                getWalletTransactions(),
                getWalletOffers(),
            ]);

            const failures = [];

            // Wallet balance
            if (results[0].status === 'fulfilled') {
                setWallet(results[0].value);
            } else {
                failures.push(
                    'Balance: ' + getErrorMessage(results[0].reason),
                );
            }

            // Wallet transactions
            if (results[1].status === 'fulfilled') {
                const data = results[1].value;

                setTransactions(
                    Array.isArray(data?.transactions)
                        ? data.transactions
                        : [],
                );
            } else {
                failures.push(
                    'Transactions: ' + getErrorMessage(results[1].reason),
                );
            }

            // Wallet offers
            if (results[2].status === 'fulfilled') {
                const data = results[2].value;

                // Supports either:
                // data: [...]
                // data: { offers: [...] }
                const offerList = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.offers)
                        ? data.offers
                        : [];

                setOffers(offerList);
                setOffersError('');
            } else {
                setOffersError(
                    getErrorMessage(results[2].reason),
                );
            }

            setError(failures.join('\n'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);


    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData]),
    );

    const renderTransaction = ({ item }) => {
        const isCredit = item.type === 'credit';

        return (

            <View style={styles.transaction}>
                <View
                    style={[
                        styles.transactionIcon,
                        isCredit ? styles.creditBg : styles.debitBg,
                    ]}>
                    <AppIcon name={isCredit ? 'credit' : 'debit'} style={[
                            styles.iconText,
                            isCredit ? styles.credit : styles.debit,
                        ]} />
                </View>

                <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>
                        {isCredit ? 'Money Added' : 'Wallet Deduction'}
                    </Text>

                    <Text style={styles.date}>
                        {item.date || 'Date unavailable'}
                    </Text>

                    {item.added_by ? (
                        <Text style={styles.date}>
                            {String(item.added_by)}
                        </Text>
                    ) : null}
                </View>

                <View style={styles.transactionAmount}>
                    <Text
                        style={[
                            styles.amount,
                            isCredit ? styles.credit : styles.debit,
                        ]}>
                        {isCredit ? '+' : '-'}
                        {formatMoney(item.amount)}
                    </Text>

                    <Text style={styles.balanceAfter}>
                        Bal: {formatMoney(item.balance)}
                    </Text>
                </View>
            </View>
        );
    };

    const renderHeader = () => (
        <>
            <Text style={styles.title}>My Wallet</Text>

            <Text style={styles.subtitle}>
                Your wallet balance and transaction history.
            </Text>

            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>
                    Available Balance
                </Text>

                <Text style={styles.balance}>
                    {wallet
                        ? formatMoney(wallet.balance)
                        : '—'}
                </Text>

                <Text style={styles.currency}>
                    {wallet?.currency || 'INR'}
                </Text>

                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Add Money"
                    style={styles.addMoneyButton}
                    onPress={() => setAmountModalVisible(true)}>
                    <AppIcon name="plus" size={18} color={colors.primary} />
                    <Text style={styles.addMoneyText}>Add Money</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.offersSection}>
                <Text style={styles.sectionTitle}>
                    Wallet Offers
                </Text>

                {offersError ? (
                    <Text style={styles.error}>
                        {offersError}
                    </Text>
                ) : offers.length === 0 ? (
                    <View style={styles.emptyOffer}>
                        <Text style={styles.offerDescription}>
                            No wallet offers available right now.
                        </Text>
                    </View>
                ) : (

                    offers.map((offer, index) => {
                        const title = offer.title || `Wallet Offer ${index + 1}`;

                        const description = offer.description || '';

                        const amount = Number(offer.amount);
                        const bonusPercentage = Number(offer.add_on_percentage);
                        const finalAmount = Number(offer.final_amount);

                        const hasAmount =
                            offer.amount !== null &&
                            offer.amount !== undefined &&
                            offer.amount !== '' &&
                            Number.isFinite(amount);

                        const hasBonus =
                            offer.add_on_percentage !== null &&
                            offer.add_on_percentage !== undefined &&
                            offer.add_on_percentage !== '' &&
                            Number.isFinite(bonusPercentage);

                        const hasFinalAmount =
                            offer.final_amount !== null &&
                            offer.final_amount !== undefined &&
                            offer.final_amount !== '' &&
                            Number.isFinite(finalAmount);

                        return (
                            <View
                                key={String(offer.id ?? index)}
                                style={styles.offerCard}>

                                <View style={styles.offerTop}>
                                    <AppIcon name="gift" style={styles.offerEmoji} />

                                    <View style={styles.offerContent}>
                                        <Text style={styles.offerTitle}>
                                            {title}
                                        </Text>

                                        {description ? (
                                            <Text style={styles.offerDescription}>
                                                {description}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>

                                <View style={styles.offerDivider} />

                                <View style={styles.offerDetails}>
                                    <View style={styles.offerDetailItem}>
                                        <Text style={styles.offerDetailLabel}>
                                            Recharge Amount
                                        </Text>

                                        <Text style={styles.offerDetailValue}>
                                            {hasAmount ? formatMoney(amount) : '—'}
                                        </Text>
                                    </View>

                                    <View style={styles.offerDetailItem}>
                                        <Text style={styles.offerDetailLabel}>
                                            Bonus
                                        </Text>

                                        <Text style={styles.bonusValue}>
                                            {hasBonus ? `${bonusPercentage}%` : '—'}
                                        </Text>
                                    </View>

                                    <View style={styles.offerDetailItem}>
                                        <Text style={styles.offerDetailLabel}>
                                            Final Wallet Value
                                        </Text>

                                        <Text style={styles.finalAmount}>
                                            {hasFinalAmount ? formatMoney(finalAmount) : '—'}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    accessibilityRole="button"
                                    accessibilityLabel={`Buy ${title}`}
                                    style={styles.offerBuyButton}
                                    onPress={() => Alert.alert(
                                        'Buy Wallet Offer',
                                        `You selected ${title}. Purchasing wallet offers is not available in the app yet.`,
                                    )}>
                                    <Text style={styles.offerBuyText}>Buy</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })

                )}
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    Wallet Transactions
                </Text>

                <Text style={styles.count}>
                    {transactions.length} Entries
                </Text>
            </View>

            {error ? (
                <Text style={styles.error}>{error}</Text>
            ) : null}
        </>
    );

    return (
        <View style={styles.container}>
            <WalletAmountModal
                visible={amountModalVisible}
                onClose={() => setAmountModalVisible(false)}
            />
            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator
                        size="large"
                        color={colors.primary}
                    />
                    <Text style={styles.loadingText}>
                        Loading wallet...
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item, index) =>
                        `${item.id}-${item.type}-${index}`
                    }
                    renderItem={renderTransaction}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={
                        !error ? (
                            <View style={styles.emptyBox}>
                                <Text style={styles.emptyText}>
                                    No wallet transactions found.
                                </Text>
                            </View>
                        ) : null
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadData(true)}
                            colors={[colors.primary]}
                        />
                    }
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
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
    loadingBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 13,
        marginTop: 12,
        color: colors.textSecondary,
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
    },
    balanceCard: {
        backgroundColor: '#34205D',
        borderRadius: 18,
        padding: 22,
        marginBottom: 25,
    },
    offerBuyButton: {
        backgroundColor: colors.primary,
        borderRadius: 11,
        minHeight: 48,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 16,
    },
    offerBuyText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    addMoneyButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 11,
        minHeight: 48,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginTop: 20,
    },
    addMoneyText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '800',
    },
    balanceLabel: {
        fontSize: 13,
        color: '#E1D8F2',
    },
    balance: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 13,
    },
    currency: {
        color: '#E1D8F2',
        marginTop: 6,
        fontSize: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    count: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    transaction: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#EEEAF7',
        marginBottom: 10,
    },
    transactionIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 11,
    },
    creditBg: {
        backgroundColor: '#E8F7EF',
    },
    debitBg: {
        backgroundColor: '#FFF0F0',
    },
    iconText: {
        fontSize: 21,
        fontWeight: '800',
    },
    transactionInfo: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.text,
    },
    date: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 5,
    },
    transactionAmount: {
        alignItems: 'flex-end',
        marginLeft: 8,
    },
    amount: {
        fontSize: 14,
        fontWeight: '800',
    },
    credit: {
        color: '#20834A',
    },
    debit: {
        color: '#C43B4B',
    },
    balanceAfter: {
        fontSize: 10,
        color: colors.textSecondary,
        marginTop: 6,
    },
    emptyBox: {
        paddingVertical: 35,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    error: {
        color: '#C43B4B',
        fontSize: 12,
        marginBottom: 12,
    },
    offersSection: {
        marginBottom: 25,
    },
    offersHeader: {
        marginBottom: 12,
    },
    offerCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EEEAF7',
        borderRadius: 14,
        padding: 17,
    },
    offerTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.text,
    },
    offerDescription: {
        fontSize: 12,
        lineHeight: 19,
        marginTop: 8,
        color: colors.textSecondary,
    },
    offerNote: {
        fontSize: 11,
        marginTop: 12,
        color: colors.primary,
    },

    offersSection: {
        marginBottom: 25,
    },
    offerCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EEEAF7',
        borderRadius: 14,
        padding: 16,
        marginTop: 12,
    },
    offerTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    offerEmoji: {
        fontSize: 24,
        marginRight: 12,
    },
    offerContent: {
        flex: 1,
    },
    offerTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.text,
    },
    offerDescription: {
        marginTop: 6,
        fontSize: 12,
        lineHeight: 19,
        color: colors.textSecondary,
    },
    offerDivider: {
        height: 1,
        backgroundColor: '#EEEAF7',
        marginVertical: 14,
    },
    offerDetails: {
        gap: 10,
    },
    offerDetailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    offerDetailLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    offerDetailValue: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    bonusValue: {
        color: '#20834A',
        fontWeight: '800',
        fontSize: 14,
    },
    finalAmount: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.primary,
    },
});
