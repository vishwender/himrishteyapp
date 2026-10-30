// @refresh reset
import ActivityProfileCard from '../../components/ActivityProfileCard';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import {
  getSentInterests,
  getReceivedInterests,
  acceptInterest,
  rejectInterest,
  cancelInterest,
} from '../../api/interestApi';
import { notifyInterestChanged } from '../../services/interestSync';
import colors from '../../theme/colors';

const STATUS_TABS = [
  {key: '1', title: 'Accepted'},
  {key: '2', title: 'Rejected'},
  {key: '0', title: 'Pending'},
];

const TABS = [
  { key: 'received', title: 'Received' },
  { key: 'sent', title: 'Sent' },
  { key: 'accepted', title: 'Accepted' },
  { key: 'rejected', title: 'Rejected' },
];


function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong.'
  );
}

function statusLabel(status) {
  switch (String(status)) {
    case '0':
      return 'Pending';
    case '1':
      return 'Accepted';
    case '2':
      return 'Rejected';
    default:
      return 'Unknown';
  }
}

function InterestCard({
  item,
  onOpenProfile,
  onAccept,
  onReject,
  onCancel,
  busy,
}) {
  const member = item.member;
  const status = String(item.status);
  const pending = status === '0';

  return (
    <ActivityProfileCard
      member={member}
      activityIcon={status === '1' ? 'check' : status === '2' ? 'close'
        : item.direction === 'sent' ? 'send' : 'heart'}
      onOpenProfile={onOpenProfile}
      description={status === '1' ? 'Interest accepted'
        : status === '2' ? 'Interest rejected'
          : pending ? item.direction === 'sent' ? 'Interest sent' : 'Interest received'
            : 'Interest status unavailable'}>
      <View style={styles.statusRow}>
        <View style={[
          styles.statusBadge,
          status === '1' && styles.acceptedBadge,
          status === '2' && styles.rejectedBadge,
        ]}>
          <Text style={[
            styles.statusText,
            status === '1' && styles.acceptedText,
            status === '2' && styles.rejectedText,
          ]}>
            {statusLabel(item.status)}
          </Text>
        </View>

        <Text style={styles.dateText}>
          {(item.sent_at || item.received_at || '')
            .slice(0, 10)}
        </Text>
      </View>

      {pending && item.direction === 'received' ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.acceptButton}
            disabled={busy}
            onPress={() => onAccept(item)}
            activeOpacity={0.8}>
            <Text style={styles.acceptButtonText}>
              Accept
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rejectButton}
            disabled={busy}
            onPress={() => onReject(item)}
            activeOpacity={0.8}>
            <Text style={styles.rejectButtonText}>
              Reject
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {pending && item.direction === 'sent' ? (
        <TouchableOpacity
          style={styles.cancelButton}
          disabled={busy}
          onPress={() => onCancel(item)}
          activeOpacity={0.8}>
          <Text style={styles.cancelButtonText}>
            Cancel Interest
          </Text>
        </TouchableOpacity>
      ) : null}

      {busy ? (
        <ActivityIndicator
          style={styles.busyIndicator}
          size="small"
          color={colors.primary}
        />
      ) : null}
    </ActivityProfileCard>
  );
}

export default function InterestsScreen({route}) {
  const receivedMode = route?.params?.tab === 'received';
  const sentMode = route?.params?.tab === 'sent';
  const statusMode = receivedMode || sentMode;
  const statusScope = statusMode ? route.params.tab : null;
  const [requestStatus, setRequestStatus] = useState('0');
  const bottomBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();

  const [selectedTab, setSelectedTab] =
    useState('received');

  useEffect(() => {
    if (TABS.some(tab => tab.key === route?.params?.tab)) {
      setSelectedTab(route.params.tab);
    }
  }, [route?.params?.tab]);

  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const requestRef = useRef(0);
  const busyRef = useRef(false);

  const loadData = useCallback(async (refresh = false) => {
    const requestId = ++requestRef.current;

    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const [sentData, receivedData] = await Promise.all([
        getSentInterests(),
        getReceivedInterests(),
      ]);

      if (requestId !== requestRef.current) {
        return;
      }

      setSent((Array.isArray(sentData) ? sentData : []).map(item => ({
        ...item,
        direction: 'sent',
      })));

      setReceived((Array.isArray(receivedData) ? receivedData : []).map(item => ({
        ...item,
        direction: 'received',
      })));

    } catch (err) {
      if (requestId === requestRef.current) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Refresh on navigation focus so updates made on Member Profile
  // or from another session are reflected when returning here.
  // Switching tabs does not trigger a new request.
  useFocusEffect(
    useCallback(() => {
      if (statusScope) setRequestStatus('0');
      loadData();
      return () => {
        requestRef.current += 1;
      };
    }, [loadData, statusScope]),
  );

  const filteredInterests = useMemo(() => {
    if (statusMode) {
      return (receivedMode ? received : sent).filter(item => String(item.status) === requestStatus);
    }
    if (selectedTab === 'sent') {
      return sent;
    }

    if (selectedTab === 'received') {
      return received;
    }

    const status = selectedTab === 'accepted' ? '1' : '2';

    return [...received, ...sent]
      .filter(item => String(item.status) === status)
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [selectedTab, sent, received, receivedMode, statusMode, requestStatus]);

  const openProfile = useCallback(
    profileId => {
      navigation.getParent()?.navigate('MemberProfile', {
        profileId,
      });
    },
    [navigation],
  );

  const handleAction = useCallback(
    (item, action) => {
      if (busyRef.current) {
        return;
      }

      const isCancel = action === 'cancel';

      const actionName = {
        accept: 'Accept Interest',
        reject: 'Reject Interest',
        cancel: 'Cancel Interest',
      }[action];

      Alert.alert(
        actionName,
        `Are you sure you want to ${action} this interest?`,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            style: action === 'accept'
              ? 'default'
              : 'destructive',
            onPress: async () => {
              if (busyRef.current) {
                return;
              }

              busyRef.current = true;
              setBusyId(item.id);

              try {
                if (action === 'accept') {
                  const result =
                    await acceptInterest(item.id);

                  setReceived(previous =>
                    previous.map(entry =>
                      entry.id === item.id
                        ? {
                          ...entry,
                          status: result.status,
                          status_label: 'Accepted',
                        }
                        : entry,
                    ),
                  );
                } else if (action === 'reject') {
                  const result =
                    await rejectInterest(item.id);

                  setReceived(previous =>
                    previous.map(entry =>
                      entry.id === item.id
                        ? {
                          ...entry,
                          status: result.status,
                          status_label: 'Rejected',
                        }
                        : entry,
                    ),
                  );
                } else if (isCancel) {
                  const result = await cancelInterest(item.id);

                  if (result?.cancelled !== true) {
                    throw new Error(
                      'Cancellation was not confirmed.',
                    );
                  }

                  setSent(previous =>
                    previous.filter(entry => entry.id !== item.id),
                  );

                  // item.profile_id is the numeric recipient members.id.
                  // Home uses the same numeric key for interest events.
                  notifyInterestChanged(item.profile_id, null, null);
                }

                // Refresh from the backend on the next screen focus.
              } catch (err) {
                Alert.alert(
                  'Action failed',
                  getErrorMessage(err),
                );
              } finally {
                busyRef.current = false;
                setBusyId(null);
              }
            },
          },
        ],
      );
    },
    [],
  );

  const renderInterest = useCallback(
    ({ item }) => (
      <InterestCard
        item={item}
        onOpenProfile={openProfile}
        onAccept={entry => handleAction(entry, 'accept')}
        onReject={entry => handleAction(entry, 'reject')}
        onCancel={entry => handleAction(entry, 'cancel')}
        busy={busyId === item.id}
      />
    ),
    [openProfile, handleAction, busyId],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{receivedMode ? 'Interests Received' : sentMode ? 'Interests Sent' : 'My Interests'}</Text>
        <Text style={styles.subtitle}>
          Manage your connections and requests
        </Text>
      </View>

      <View style={styles.tabRow}>
        {(statusMode ? STATUS_TABS : TABS).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              (statusMode ? requestStatus : selectedTab) === tab.key && styles.selectedTab,
            ]}
            accessibilityRole="tab"
            accessibilityState={{selected: (statusMode ? requestStatus : selectedTab) === tab.key}}
            onPress={() => statusMode ? setRequestStatus(tab.key) : setSelectedTab(tab.key)}>
            <Text
              style={[
                styles.tabText,
                (statusMode ? requestStatus : selectedTab) === tab.key &&
                styles.selectedTabText,
              ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
          <Text style={styles.muted}>
            Loading interests...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredInterests}
          keyExtractor={item =>
            `${item.direction}-${item.id}`
          }
          renderItem={renderInterest}
          contentContainerStyle={[styles.listContent, {paddingBottom: bottomBarHeight + 35}]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {error}
                </Text>

                <TouchableOpacity
                  onPress={() => loadData(true)}>
                  <Text style={styles.retryText}>
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !error ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>
                  No {statusMode ? STATUS_TABS.find(tab => tab.key === requestStatus)?.title.toLowerCase() : selectedTab} interests
                </Text>

                <Text style={styles.muted}>
                  Your interests will appear here.
                </Text>
              </View>
            ) : null
          }
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.title,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingBottom: 14,
    gap: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F4F1FA',
  },
  selectedTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  selectedTabText: {
    color: '#FFFFFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muted: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSecondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 35,
    flexGrow: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  statusBadge: {
    backgroundColor: '#FFF4E5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    color: '#9A6200',
    fontSize: 11,
    fontWeight: '700',
  },
  acceptedBadge: {
    backgroundColor: '#E7F7ED',
  },
  acceptedText: {
    color: '#16834B',
  },
  rejectedBadge: {
    backgroundColor: '#FFF0F0',
  },
  rejectedText: {
    color: '#B42318',
  },
  dateText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  acceptButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#E7F7ED',
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#16834B',
    fontWeight: '700',
  },
  rejectButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#B42318',
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#FFF0F0',
    padding: 12,
    marginTop: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#B42318',
    fontWeight: '700',
  },
  busyIndicator: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.title,
  },
  errorBox: {
    padding: 15,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#B42318',
  },
  retryText: {
    marginTop: 10,
    color: colors.primary,
    fontWeight: '700',
  },
});
