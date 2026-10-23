// @refresh reset
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  Image,
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
import { getProfileImage } from '../../config/images';
import colors from '../../theme/colors';

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
  const imageURL = getProfileImage(member?.photo);

  const initials = (member?.full_name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();

  const status = String(item.status);
  const pending = status === '0';

  const location = [
    member?.city_living_in,
    member?.state_living_in,
  ].filter(Boolean).join(', ');

  const canOpen = Boolean(member?.profile_id);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.profileRow}
        activeOpacity={0.8}
        disabled={!canOpen}
        onPress={() => onOpenProfile(member.profile_id)}>

        <View style={styles.photoBox}>
          {imageURL ? (
            <Image
              source={{ uri: imageURL }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.initials}>
              {initials}
            </Text>
          )}
        </View>

        <View style={styles.memberInfo}>
          <Text
            numberOfLines={1}
            style={styles.memberName}>
            {member?.full_name || 'Profile unavailable'}
          </Text>

          <Text style={styles.profileId}>
            {member?.profile_id || 'Unknown profile'}
          </Text>

          <Text
            numberOfLines={1}
            style={styles.location}>
            {location || 'Location not specified'}
          </Text>

          <Text style={styles.direction}>
            {status === '1'
              ? 'Interest accepted'
              : status === '2'
                ? 'Interest rejected'
                : pending
                  ? item.direction === 'sent'
                    ? 'Interest sent'
                    : 'Interest received'
                  : 'Interest status unavailable'}
          </Text>
        </View>
      </TouchableOpacity>

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
    </View>
  );
}

export default function InterestsScreen() {
  const navigation = useNavigation();

  const [selectedTab, setSelectedTab] =
    useState('received');

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
      loadData();
      return () => {
        requestRef.current += 1;
      };
    }, [loadData]),
  );

  const filteredInterests = useMemo(() => {
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
  }, [selectedTab, sent, received]);

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
        <Text style={styles.title}>My Interests</Text>
        <Text style={styles.subtitle}>
          Manage your connections and requests
        </Text>
      </View>

      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.selectedTab,
            ]}
            onPress={() => setSelectedTab(tab.key)}>
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.key &&
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
          contentContainerStyle={styles.listContent}
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
                  No {selectedTab} interests
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
    fontSize: 25,
    fontWeight: '800',
    color: colors.text,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEAF7',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoBox: {
    width: 72,
    height: 82,
    borderRadius: 12,
    backgroundColor: '#EDE9FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontSize: 23,
    fontWeight: '700',
    color: colors.primary,
  },
  memberInfo: {
    flex: 1,
    paddingLeft: 14,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  profileId: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 5,
  },
  direction: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 5,
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
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
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
