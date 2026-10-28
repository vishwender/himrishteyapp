import AppIcon from '../../components/AppIcon';

import React, { useCallback, useState } from 'react';

import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    StyleSheet,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { getWalletTransactions } from '../../api/membershipWalletApi';
import colors from '../../theme/colors';

const money = value => {
    const number = Number(value || 0);

    return `₹${number.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

export default function WalletTransactionsScreen() {
    const [transactions, setTransactions] = useState([]);
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadTransactions = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await getWalletTransactions();

            setTransactions(
                Array.isArray(data.transactions)
                    ? data.transactions
                    : [],
            );

            setBalance(data.current_balance);
            setError('');
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                'Unable to load wallet transactions.',
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadTransactions();
        }, [loadTransactions]),
    );

    const renderTransaction = ({ item }) => {
        const isCredit = item.type === 'credit';

        return (
            <View style={styles.transaction}>
                <View style={styles.iconBox}>
                    <AppIcon name={isCredit ? 'credit' : 'debit'} style={styles.icon} />
                </View>

                <View style={styles.transactionDetails}>
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

                <View style={styles.amountBox}>
                    <Text
                        style={[
                            styles.amount,
                            isCredit ? styles.credit : styles.debit,
                        ]}>
                        {isCredit ? '+' : '−'}{money(item.amount)}
                    </Text>

                    <Text style={styles.date}>
                        Balance: {money(item.balance)}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Current Wallet Balance</Text>
                <Text style={styles.balance}>
                    {balance === null ? '—' : money(balance)}
                </Text>
            </View>

            <Text style={styles.heading}>Transaction History</Text>

            {loading ? (
                <ActivityIndicator
                    color={colors.primary}
                    size="large"
                    style={styles.loader}
                />
            ) : error ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item, index) =>
                        `${item.id}-${item.type}-${index}`
                    }
                    renderItem={renderTransaction}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadTransactions(true)}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>
                                No wallet transactions found.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAF9FF' },
    balanceCard: {
        margin: 16,
        padding: 20,
        borderRadius: 16,
        backgroundColor: '#34205D',
    },
    balanceLabel: { color: '#E1D8F2', fontSize: 13 },
    balance: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 28,
        marginTop: 10,
    },
    heading: {
        fontSize: 19,
        fontWeight: '800',
        color: colors.title,
        marginHorizontal: 16,
        marginBottom: 10,
    },
    list: { paddingHorizontal: 16, paddingBottom: 32 },
    transaction: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEEAF7',
        marginBottom: 9,
        padding: 13,
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#F0EAFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    icon: { fontSize: 20, color: colors.primary },
    transactionDetails: { flex: 1 },
    transactionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.title,
    },
    date: {
        fontSize: 10,
        color: colors.textSecondary,
        marginTop: 5,
    },
    amountBox: { alignItems: 'flex-end', marginLeft: 8 },
    amount: { fontSize: 13, fontWeight: '800' },
    credit: { color: '#20834A' },
    debit: { color: '#C43B4B' },
    emptyBox: { padding: 30, alignItems: 'center' },
    emptyText: { color: colors.textSecondary, textAlign: 'center' },
    loader: { marginTop: 35 },
});
