import AppIcon from '../../components/AppIcon';
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
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useFocusEffect } from '@react-navigation/native';

import {
  subscribeShortlistChanges,
  notifyShortlistChanged,
} from '../../services/shortlistSync';

import {
  subscribeInterestChanges,
  notifyInterestChanged,
} from '../../services/interestSync';

import { useAuth } from '../../context/AuthContext';
import HomeMemberCard from '../../components/home/HomeMemberCard';

import {
  getDiscoverProfiles,
  sendHomeInterest,
  addHomeShortlist,
  removeHomeShortlist,
} from '../../api/homeApi';

import colors from '../../theme/colors';

const PAGE_SIZE = 10;

const TABS = [
  {
    id: 'matches',
    section: 'matches',
    title: 'Matches for You',
    icon: 'sparkles',
  },
  {
    id: 'recent',
    section: 'recently_joined',
    title: 'Recently Joined',
    icon: 'recent',
  },
  {
    id: 'verified',
    section: 'verified',
    title: 'Verified Profiles',
    icon: 'verified',
  },
  {
    id: 'shortlisted',
    section: 'shortlisted',
    title: 'Shortlisted',
    icon: 'bookmark',
  },
  {
    id: 'viewed_you',
    section: 'viewed_you',
    title: 'Viewed You',
    icon: 'eye',
  },
];

// -----------------------------------------
// Helpers
// -----------------------------------------

function createTabState() {
  return {
    profiles: [],
    nextCursor: null,
    loaded: false,
    loading: false,
    loadingMore: false,
    refreshing: false,
    error: '',
    errorMode: null,
  };
}

function createInitialState() {
  const result = {};

  TABS.forEach(tab => {
    result[tab.id] = createTabState();
  });

  return result;
}

function memberKey(member) {
  return String(
    member?.id ?? member?.profile_id ?? '',
  );
}

function mergeProfiles(existing, incoming) {
  const seen = new Set();
  const result = [];

  [...existing, ...incoming].forEach(member => {
    const key = memberKey(member);

    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(member);
  });

  return result;
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Unable to load profiles.'
  );
}

function isSaved(value) {
  return (
    value === true ||
    value === 1 ||
    value === '1' ||
    String(value).toLowerCase() === 'yes'
  );
}

// -----------------------------------------
// Home Screen
// -----------------------------------------

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, canSendInterest } = useAuth();

  const [selectedTab, setSelectedTab] = useState('matches');

  const [tabStates, setTabStates] = useState(
    createInitialState,
  );

  const [busyMember, setBusyMember] = useState(null);

  const tabStatesRef = useRef(tabStates);
  const requestsRef = useRef({});
  const versionsRef = useRef({});
  const userScrolledRef = useRef(false);

  // Locally confirmed shortlist changes override
  // old API responses until the screen is remounted.
  const shortlistOverridesRef = useRef({});
  const interestOverridesRef = useRef({});

  // Synchronous lock prevents rapid repeated actions.
  const actionBusyRef = useRef(false);

  const currentUser = user || {};

  const firstName = String(
    currentUser.full_name || '',
  )
    .trim()
    .split(/\s+/)[0];

  // -----------------------------------------
  // Update tab state
  // -----------------------------------------

  const updateTab = useCallback((tabId, updater) => {
    const current = tabStatesRef.current;

    const previous =
      current[tabId] || createTabState();

    const nextTab =
      typeof updater === 'function'
        ? updater(previous)
        : { ...previous, ...updater };

    const next = {
      ...current,
      [tabId]: nextTab,
    };

    tabStatesRef.current = next;
    setTabStates(next);
  }, []);

  // -----------------------------------------
  // Apply confirmed shortlist state to API data
  // -----------------------------------------

  const applyShortlistOverrides = useCallback(profiles => {
    return profiles.map(profile => {
      const key = memberKey(profile);

      if (
        Object.prototype.hasOwnProperty.call(
          shortlistOverridesRef.current,
          key,
        )
      ) {
        return {
          ...profile,
          is_shortlisted:
            shortlistOverridesRef.current[key],
        };
      }

      return profile;
    });
  }, []);

  // -----------------------------------------
  // Apply locally confirmed interest changes
  // -----------------------------------------

  const applyInterestOverrides = useCallback(profiles => {
    return profiles.map(profile => {
      const key = memberKey(profile);

      if (
        !Object.prototype.hasOwnProperty.call(
          interestOverridesRef.current,
          key,
        )
      ) {
        return profile;
      }

      const override = interestOverridesRef.current[key];

      return {
        ...profile,
        interest_status: override.interestStatus,
        interest_id: override.interestId,
      };
    });
  }, []);

  // -----------------------------------------
  // Fetch discovery profiles
  // -----------------------------------------

  const loadProfiles = useCallback(
    async (tabId, mode = 'initial') => {
      const current = tabStatesRef.current[tabId];

      if (!current) {
        return;
      }

      const isLoadMore = mode === 'more';
      const isRefresh = mode === 'refresh';

      if (requestsRef.current[tabId]) {
        return;
      }

      if (isLoadMore) {
        if (
          !current.loaded ||
          !current.nextCursor ||
          current.loading ||
          current.loadingMore ||
          current.refreshing
        ) {
          return;
        }
      } else if (!isRefresh && current.loaded) {
        return;
      }

      const tab = TABS.find(item => item.id === tabId);

      if (!tab) {
        return;
      }

      const interestSnapshot = {...interestOverridesRef.current};
      const version =
        (versionsRef.current[tabId] || 0) + 1;

      versionsRef.current[tabId] = version;
      requestsRef.current[tabId] = true;

      updateTab(tabId, previous => ({
        ...previous,
        loading: !isLoadMore && !isRefresh,
        loadingMore: isLoadMore,
        refreshing: isRefresh,
        error: '',
        errorMode: null,
      }));

      try {
        const result = await getDiscoverProfiles({
          section: tab.section,
          perPage: PAGE_SIZE,
          cursor: isLoadMore
            ? current.nextCursor
            : null,
        });

        if (versionsRef.current[tabId] !== version) {
          return;
        }

        // A response started after a local change is authoritative for members
        // it contains. Preserve newer changes made while this request was running.
        (result.profiles || []).forEach(profile => {
          const key = memberKey(profile);
          if (interestOverridesRef.current[key] === interestSnapshot[key]) {
            delete interestOverridesRef.current[key];
          }
        });

        const incoming = applyInterestOverrides(
          applyShortlistOverrides(
            Array.isArray(result.profiles)
              ? result.profiles
              : [],
          ),
        );

        updateTab(tabId, previous => ({
          ...previous,
          profiles: isLoadMore
            ? mergeProfiles(previous.profiles, incoming)
            : mergeProfiles([], incoming),
          nextCursor: result.nextCursor || null,
          loaded: true,
          loading: false,
          loadingMore: false,
          refreshing: false,
          error: '',
          errorMode: null,
        }));

        // Reconcile other mounted screens when a refresh discovers a server
        // transition (for example pending -> accepted by the recipient).
        incoming.forEach(profile => {
          if (profile.interest_status === undefined) return;
          const previous = current.profiles.find(item => memberKey(item) === memberKey(profile));
          if (previous && previous.interest_status === profile.interest_status &&
              previous.interest_id === profile.interest_id) return;
          notifyInterestChanged(profile.id, profile.interest_status, profile.interest_id ?? null);
        });
      } catch (error) {
        if (versionsRef.current[tabId] !== version) {
          return;
        }

        updateTab(tabId, previous => ({
          ...previous,
          loading: false,
          loadingMore: false,
          refreshing: false,
          error: getErrorMessage(error),
          errorMode: mode,
        }));
      } finally {
        requestsRef.current[tabId] = false;
      }
    },
    [updateTab, applyShortlistOverrides, applyInterestOverrides],
  );

  // -----------------------------------------
  // Load selected tab only when needed
  // -----------------------------------------

  useFocusEffect(
    useCallback(() => {
      const current = tabStatesRef.current[selectedTab];

      if (
        selectedTab === 'shortlisted' &&
        current &&
        !current.loaded &&
        !requestsRef.current.shortlisted
      ) {
        loadProfiles('shortlisted');
      }
    }, [selectedTab, loadProfiles]),
  );

  useEffect(() => {
    userScrolledRef.current = false;

    if (!tabStatesRef.current[selectedTab]?.loaded) {
      loadProfiles(selectedTab);
    }
  }, [selectedTab, loadProfiles]);

  // -----------------------------------------
  // Infinite scrolling
  // -----------------------------------------

  const loadMore = useCallback(() => {
    if (!userScrolledRef.current) {
      return;
    }

    const current = tabStatesRef.current[selectedTab];

    if (
      !current?.loaded ||
      !current.nextCursor ||
      current.loading ||
      current.loadingMore ||
      current.refreshing ||
      current.error
    ) {
      return;
    }

    userScrolledRef.current = false;

    loadProfiles(selectedTab, 'more');
  }, [selectedTab, loadProfiles]);

  // -----------------------------------------
  // Pull to refresh
  // -----------------------------------------

  const refreshTab = useCallback(() => {
    userScrolledRef.current = false;

    loadProfiles(selectedTab, 'refresh');
  }, [selectedTab, loadProfiles]);

  // -----------------------------------------
  // Synchronize shortlist across tabs
  // -----------------------------------------

  const synchronizeShortlist = useCallback(
    (memberId, shortlisted) => {
      const key = String(memberId);

      shortlistOverridesRef.current[key] = shortlisted;

      const current = tabStatesRef.current;
      const next = { ...current };

      TABS.forEach(tab => {
        const previous = current[tab.id];

        next[tab.id] = {
          ...previous,
          profiles: previous.profiles.map(profile => {
            if (memberKey(profile) !== key) {
              return profile;
            }

            return {
              ...profile,
              is_shortlisted: shortlisted,
            };
          }),
        };
      });

      // The shortlist membership changed, so previously
      // cached pagination cursors may no longer be valid.
      //
      // Invalidate its cached data and reload when needed.
      next.shortlisted = {
        ...createTabState(),
      };

      tabStatesRef.current = next;
      setTabStates(next);
    },
    [],
  );


  const synchronizeInterest = useCallback(
    ({ memberId, interestStatus, interestId }) => {
      const key = String(memberId);

      interestOverridesRef.current[key] = {
        interestStatus,
        interestId,
      };

      const current = tabStatesRef.current;
      const next = { ...current };

      TABS.forEach(tab => {
        const previous = current[tab.id];

        next[tab.id] = {
          ...previous,
          profiles: previous.profiles.map(profile => {
            if (memberKey(profile) !== key) {
              return profile;
            }

            return {
              ...profile,
              interest_status: interestStatus,
              interest_id: interestId,
            };
          }),
        };
      });

      tabStatesRef.current = next;
      setTabStates(next);
    },
    [],
  );



  useEffect(() => {
    const unsubscribe = subscribeShortlistChanges(
      ({ memberId, isShortlisted }) => {
        synchronizeShortlist(
          memberId,
          isShortlisted,
        );
      },
    );

    return unsubscribe;
  }, [synchronizeShortlist]);

  useEffect(() => {
    return subscribeInterestChanges(
      synchronizeInterest,
    );
  }, [synchronizeInterest]);

  // -----------------------------------------
  // Open member profile
  // -----------------------------------------

  const openMember = useCallback(
    member => {
      if (!member?.profile_id) {
        Alert.alert(
          'Profile Unavailable',
          'This member does not have a valid profile ID.',
        );
        return;
      }

      navigation.getParent()?.navigate('MemberProfile', {
        profileId: member.profile_id,
      });
    },
    [navigation],
  );

  // -----------------------------------------
  // Send Interest
  // -----------------------------------------


  const handleInterest = useCallback(
    async member => {
      const id = Number(member?.id);

      if (
        !Number.isInteger(id) ||
        id <= 0 ||
        actionBusyRef.current
      ) {
        return;
      }

      if (!canSendInterest) {
        Alert.alert(
          'Activate Profile',
          'Your profile must be active before you can send interests.',
        );
        return;
      }

      // Use local synchronized status if available.
      const key = String(id);

      const override = interestOverridesRef.current[key];

      const existingStatus = override
        ? override.interestStatus
        : member.interest_status;

      if (
        existingStatus !== null &&
        existingStatus !== undefined
      ) {
        openMember(member);
        return;
      }

      actionBusyRef.current = true;
      setBusyMember(key);

      try {
        // Laravel SentInterestController::store expects
        // the numeric recipient members.id.
        const result = await sendHomeInterest(id);

        // Existing API helpers may return either
        // response.data.data or the whole response body.
        const data = result?.data?.data ||
          result?.data ||
          result ||
          {};

        if (data.sent !== true) {
          throw new Error(
            'Interest creation was not confirmed.',
          );
        }

        const status = String(data.status ?? '0');

        notifyInterestChanged(
          id,
          status,
          data.id ?? null,
        );

        Alert.alert(
          'Interest Sent',
          'Your interest has been submitted successfully.',
        );
      } catch (error) {
        const code = error?.response?.data?.code;
        const httpStatus = error?.response?.status;

        if (
          code === 'ACCOUNT_NOT_ACTIVE' ||
          httpStatus === 403
        ) {
          Alert.alert(
            'Account Not Active',
            'Please activate your profile to send interests.',
          );
        } else {
          Alert.alert(
            'Unable to Send Interest',
            getErrorMessage(error),
          );
        }

        // A timeout might occur after the backend
        // created the record. Do not immediately
        // retry blindly: refresh to confirm its state.
        updateTab(selectedTab, previous => ({
          ...previous,
          loaded: false,
        }));
      } finally {
        actionBusyRef.current = false;
        setBusyMember(null);
      }
    },
    [
      canSendInterest,
      openMember,
      selectedTab,
      updateTab,
    ],
  );


  // -----------------------------------------
  // Add / Remove Shortlist
  // -----------------------------------------

  const handleShortlist = useCallback(
    async member => {
      const id = Number(member?.id);

      if (
        !Number.isInteger(id) ||
        id <= 0 ||
        actionBusyRef.current
      ) {
        return;
      }

      const key = String(id);

      const previousStatus =
        Object.prototype.hasOwnProperty.call(
          shortlistOverridesRef.current,
          key,
        )
          ? shortlistOverridesRef.current[key]
          : isSaved(member.is_shortlisted);

      actionBusyRef.current = true;
      setBusyMember(key);

      try {
        if (previousStatus) {
          await removeHomeShortlist(id);
        } else {
          await addHomeShortlist(id);
        }

        // Notify all subscribed screens.
        notifyShortlistChanged(
          id,
          !previousStatus,
        );

        // When currently on Shortlisted, reload immediately
        // because a member may have been removed or added.
        if (selectedTab === 'shortlisted') {
          await loadProfiles('shortlisted', 'refresh');
        }
      } catch (error) {
        Alert.alert(
          'Shortlist Failed',
          getErrorMessage(error),
        );
      } finally {
        actionBusyRef.current = false;
        setBusyMember(null);
      }
    },
    [
      selectedTab,
      loadProfiles,
    ],
  );



  // -----------------------------------------
  // Selected tab
  // -----------------------------------------

  const activeTab = useMemo(
    () =>
      TABS.find(tab => tab.id === selectedTab) ||
      TABS[0],
    [selectedTab],
  );

  const currentTab =
    tabStates[selectedTab] || createTabState();

  const profiles = currentTab.profiles;





  // -----------------------------------------
  // Header
  // -----------------------------------------

  const renderHeader = () => (
    <View>
      <View style={styles.greetingRow}>
        <View style={styles.greetingContent}>
          <Text style={styles.brand}>
            HimRishtey
          </Text>

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
          <AppIcon name="search" style={styles.searchIcon} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('Search')}>
        <AppIcon name="search" style={styles.searchBarIcon} />

        <Text style={styles.searchPlaceholder}>
          Search by profile ID, location, caste...
        </Text>

        <AppIcon name="filters" style={styles.filterIcon} />
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
        style={styles.tabsScroll}>
        {TABS.map(tab => {
          const active = tab.id === selectedTab;

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setSelectedTab(tab.id)}
              activeOpacity={0.8}
              style={[
                styles.tab,
                active && styles.activeTab,
              ]}>
              <AppIcon name={tab.icon} size={18} color={active ? colors.white : colors.primary} style={styles.tabIcon} />

              <Text
                style={[
                  styles.tabText,
                  active && styles.activeTabText,
                ]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {activeTab.title}
        </Text>

        <Text style={styles.sectionCount}>
          {profiles.length} Loaded
        </Text>
      </View>
    </View>
  );

  // -----------------------------------------
  // Footer
  // -----------------------------------------

  const renderFooter = () => {
    if (currentTab.loadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator
            color={colors.primary}
            size="small"
          />

          <Text style={styles.footerText}>
            Loading more profiles...
          </Text>
        </View>
      );
    }

    if (
      currentTab.error &&
      profiles.length > 0
    ) {
      return (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() =>
            loadProfiles(
              selectedTab,
              currentTab.errorMode === 'more'
                ? 'more'
                : 'refresh',
            )
          }>
          <Text style={styles.retryText}>
            Unable to load profiles. Tap to retry
          </Text>
        </TouchableOpacity>
      );
    }

    if (
      currentTab.loaded &&
      !currentTab.nextCursor &&
      profiles.length > 0
    ) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You've viewed all available profiles.
          </Text>
        </View>
      );
    }

    return null;
  };

  // -----------------------------------------
  // Empty / Loading state
  // -----------------------------------------

  const renderEmpty = () => {
    if (currentTab.loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.emptyDescription}>
            Finding profiles...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <AppIcon name="heart" style={styles.emptyIcon} />

        <Text style={styles.emptyTitle}>
          {currentTab.error
            ? 'Unable to load profiles'
            : 'No profiles found'}
        </Text>

        <Text style={styles.emptyDescription}>
          {currentTab.error ||
            'There are no profiles in this category right now.'}
        </Text>

        {currentTab.error ? (
          <TouchableOpacity
            style={styles.emptyRetry}
            onPress={() =>
              loadProfiles(selectedTab, 'refresh')
            }>
            <Text style={styles.emptyRetryText}>
              Try Again
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  // -----------------------------------------
  // Main List
  // -----------------------------------------

  return (
    <FlatList
      key={selectedTab}
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={profiles}
      keyExtractor={(item, index) =>
        memberKey(item) || String(index)
      }
      renderItem={({ item }) => (
        <HomeMemberCard
          member={item}
          showMatchPercentage={selectedTab === 'matches'}
          matchPercentage={item.match_percentage}
          isShortlisted={isSaved(item.is_shortlisted)}
          interestStatus={item.interest_status}
          canSendInterest={canSendInterest}
          busy={busyMember !== null}
          onViewProfile={() => openMember(item)}
          onInterest={() => handleInterest(item)}
          onInactiveInterest={() =>
            Alert.alert(
              'Activate Profile',
              'Your profile must be active to send interests. Contact support if you need help with activation.',
            )
          }
          onShortlist={() => handleShortlist(item)}
        />
      )}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      onMomentumScrollBegin={() => {
        userScrolledRef.current = true;
      }}
      onScrollBeginDrag={() => {
        userScrolledRef.current = true;
      }}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={currentTab.refreshing}
          onRefresh={refreshTab}
          colors={[colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
      initialNumToRender={5}
      maxToRenderPerBatch={6}
      windowSize={7}
    />
  );
}

// -----------------------------------------
// Styles
// -----------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 28,
    flexGrow: 1,
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

  emptyContainer: {
    alignItems: 'center',
    paddingTop: 55,
    paddingHorizontal: 25,
    paddingBottom: 35,
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
    textAlign: 'center',
  },

  emptyDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 9,
  },

  emptyRetry: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
  },

  emptyRetryText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 9,
  },

  footerText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },

  retryButton: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  retryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});