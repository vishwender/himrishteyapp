
import React, { useCallback, useMemo, useState } from 'react';

import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useAuth } from '../../context/AuthContext';
import HomeMemberCard from '../../components/home/HomeMemberCard';

import {
  getHomeProfiles,
  sendHomeInterest,
  addHomeShortlist,
  removeHomeShortlist,
} from '../../api/homeApi';

import colors from '../../theme/colors';

const TABS = [
  {
    id: 'matches',
    title: 'Matches for You',
    icon: '✦',
    key: 'matching_profiles',
  },
  {
    id: 'recent',
    title: 'Recently Joined',
    icon: '♧',
    key: 'recent_profiles',
  },
  {
    id: 'verified',
    title: 'Verified Profiles',
    icon: '✓',
    key: 'verified_profiles',
  },
  {
    id: 'shortlisted',
    title: 'Shortlisted',
    icon: '♡',
    key: 'shortlisted_profiles',
  },
  {
    id: 'viewed',
    title: 'Viewed You',
    icon: '◉',
    key: 'profile_viewers',
  },
];

const EMPTY_HOME = {
  matching_profiles: [],
  recent_profiles: [],
  verified_profiles: [],
  shortlisted_profiles: [],
  profile_viewers: [],
};

function asArray(value) {
  if (Array.isArray(value)) return value;

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.members)) {
    return value.members;
  }

  if (Array.isArray(value?.profiles)) {
    return value.profiles;
  }

  return [];
}

function unwrapMember(item) {
  if (item?.member?.profile_id) {
    return item.member;
  }

  if (item?.profile?.profile_id) {
    return item.profile;
  }

  return item;
}

function memberKey(member) {
  return String(member.id ?? member.profile_id ?? '');
}

function errorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Unable to load profiles.'
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [selectedTab, setSelectedTab] = useState('matches');
  const [home, setHome] = useState(EMPTY_HOME);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [shortlistedIds, setShortlistedIds] = useState([]);
  const [busyMember, setBusyMember] = useState(null);

  const currentUser =
    user?.data?.member ||
    user?.member ||
    user ||
    {};

  const firstName = String(
    currentUser.full_name || '',
  ).trim().split(/\s+/)[0];

  const updateHome = useCallback(payload => {
    const data = payload?.data || payload || {};

    const normalized = {};

    TABS.forEach(tab => {
      normalized[tab.key] = asArray(data[tab.key])
        .map(unwrapMember)
        .filter(item => item && (item.profile_id || item.id));
    });

    setHome(normalized);

    const shortlist = normalized.shortlisted_profiles
      .map(memberKey)
      .filter(Boolean);

    setShortlistedIds(shortlist);
  }, []);

  const loadHome = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const data = await getHomeProfiles();
        updateHome(data);
        setError('');
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [updateHome],
  );

  useFocusEffect(
    useCallback(() => {
      loadHome();
    }, [loadHome]),
  );

  const activeTab = TABS.find(
    tab => tab.id === selectedTab,
  ) || TABS[0];

  const profiles = useMemo(
    () => home[activeTab.key] || [],
    [home, activeTab.key],
  );

  const openMember = member => {
    if (!member.profile_id) {
      Alert.alert(
        'Profile Unavailable',
        'This member does not have a valid profile ID.',
      );
      return;
    }

    // MemberProfile is registered in the parent stack.
    navigation.getParent()?.navigate('MemberProfile', {
      profileId: member.profile_id,
    });
  };

  const handleInterest = async member => {
    if (!member.profile_id || busyMember !== null) {
      return;
    }

    setBusyMember(memberKey(member));

    try {
      await sendHomeInterest(member.profile_id);

      Alert.alert(
        'Interest Sent',
        'Your interest request has been submitted.',
      );
    } catch (err) {
      Alert.alert(
        'Unable to Send Interest',
        errorMessage(err),
      );
    } finally {
      setBusyMember(null);
    }
  };

  const handleShortlist = async member => {
    const id = memberKey(member);

    if (!Number.isInteger(Number(member.id)) ||
      Number(member.id) <= 0) {
      Alert.alert(
        'Unable to Shortlist',
        'This profile does not have a valid member ID.',
      );
      return;
    }

    if (busyMember !== null) {
      return;
    }

    const alreadySaved = shortlistedIds.includes(id);

    setBusyMember(id);

    try {
      if (alreadySaved) {
        await removeHomeShortlist(member.id);

        setShortlistedIds(previous =>
          previous.filter(value => value !== id),
        );

        setHome(previous => ({
          ...previous,
          shortlisted_profiles:
            previous.shortlisted_profiles.filter(
              item => memberKey(item) !== id,
            ),
        }));
      } else {
        await addHomeShortlist(member.id);

        setShortlistedIds(previous =>
          previous.includes(id) ? previous : [...previous, id],
        );

        setHome(previous => ({
          ...previous,
          shortlisted_profiles: [
            member,
            ...previous.shortlisted_profiles.filter(
              item => memberKey(item) !== id,
            ),
          ],
        }));
      }
    } catch (err) {
      Alert.alert(
        'Shortlist Failed',
        errorMessage(err),
      );
    } finally {
      setBusyMember(null);
    }
  };

  const renderTab = tab => {
    const active = selectedTab === tab.id;

    return (
      <TouchableOpacity
        key={tab.id}
        onPress={() => setSelectedTab(tab.id)}
        style={[
          styles.tab,
          active && styles.activeTab,
        ]}
        activeOpacity={0.8}>
        <Text
          style={[
            styles.tabIcon,
            active && styles.activeTabText,
          ]}>
          {tab.icon}
        </Text>

        <Text
          style={[
            styles.tabText,
            active && styles.activeTabText,
          ]}>
          {tab.title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.greetingRow}>
        <View style={styles.greetingContent}>
          <Text style={styles.brand}>HimRishtey</Text>

          <Text style={styles.greeting}>
            Hello{firstName ? `, ${firstName}` : ''}!
          </Text>

          <Text style={styles.subtitle}>
            Let's find your perfect match today.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.searchIconButton}
          onPress={() => navigation.navigate('Search')}>
          <Text style={styles.searchIcon}>⌕</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('Search')}>
        <Text style={styles.searchBarIcon}>⌕</Text>

        <Text style={styles.searchPlaceholder}>
          Search by profile ID, location, caste...
        </Text>

        <Text style={styles.filterIcon}>☷</Text>
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
        style={styles.tabsScroll}>
        {TABS.map(renderTab)}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {activeTab.title}
        </Text>

        <Text style={styles.sectionCount}>
          {profiles.length} Profiles
        </Text>
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
    </View>
  );

  if (loading && !home.matching_profiles.length &&
    !home.recent_profiles.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.loadingText}>
          Finding your matches...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={profiles}
      keyExtractor={(item, index) =>
        String(item.profile_id || item.id || index)
      }
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => (
        <HomeMemberCard
          member={item}
          isShortlisted={
            shortlistedIds.includes(memberKey(item))
          }
          busy={busyMember !== null}
          onViewProfile={() => openMember(item)}
          onInterest={() => handleInterest(item)}
          onShortlist={() => handleShortlist(item)}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>♡</Text>

          <Text style={styles.emptyTitle}>
            No profiles found
          </Text>

          <Text style={styles.emptyDescription}>
            There are no profiles in this category right now.
          </Text>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadHome(true)}
          colors={[colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textSecondary,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingBottom: 16,
  },
  greetingContent: {
    flex: 1,
  },
  brand: {
    fontSize: 21,
    fontWeight: '900',
    color: colors.primaryDark,
    marginBottom: 10,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  searchIconButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  searchIcon: {
    fontSize: 27,
    color: colors.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    minHeight: 48,
    paddingHorizontal: 13,
    marginBottom: 16,
  },
  searchBarIcon: {
    fontSize: 24,
    color: colors.primary,
    marginRight: 9,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },
  filterIcon: {
    fontSize: 21,
    color: colors.primary,
  },
  tabsScroll: {
    marginHorizontal: -14,
    marginBottom: 19,
  },
  tabsContent: {
    paddingHorizontal: 14,
    gap: 9,
  },
  tab: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 13,
    width: 105,
    minHeight: 68,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabIcon: {
    color: colors.primary,
    fontSize: 19,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  activeTabText: {
    color: colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  sectionCount: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginBottom: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 65,
    paddingHorizontal: 25,
  },
  emptyIcon: {
    fontSize: 45,
    color: colors.primary,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  emptyDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
  },
});
