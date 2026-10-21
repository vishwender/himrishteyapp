
import React, {
  useCallback,
  useEffect,
  useState,
  memo,
} from 'react';

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

import {useNavigation} from '@react-navigation/native';

import {getHomeData} from '../../api/homeApi';
import MemberCard from '../../components/MemberCard';
import {useAuth} from '../../context/AuthContext';
import colors from '../../theme/colors';

/*
|--------------------------------------------------------------------------
| Home sections
|--------------------------------------------------------------------------
*/

const sections = [
  {
    key: 'matching_profiles',
    title: 'Matches for You',
  },
  {
    key: 'recent_profiles',
    title: 'Recently Joined',
  },
  {
    key: 'verified_profiles',
    title: 'Verified Members',
  },
  {
    key: 'shortlisted_profiles',
    title: 'My Shortlist',
  },
  {
    key: 'profile_viewers',
    title: 'Who Viewed My Profile',
  },
];

/*
|--------------------------------------------------------------------------
| Horizontal profile section
|--------------------------------------------------------------------------
*/

const ProfileSection = memo(function ProfileSection({
  title,
  profiles,
}) {
  const navigation = useNavigation();

  const renderMember = useCallback(
    ({item}) => (
      <MemberCard
        member={item}
        onPress={() => {
          navigation.navigate('MemberProfile', {
            profileId: item.profile_id,
          });
        }}
      />
    ),
    [navigation],
  );

  if (!profiles || profiles.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        <Text style={styles.count}>
          {profiles.length} profiles
        </Text>
      </View>

      <FlatList
        horizontal
        data={profiles}
        keyExtractor={item =>
          String(item.profile_id)
        }
        renderItem={renderMember}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={3}
        contentContainerStyle={styles.profileRow}
      />
    </View>
  );
});

/*
|--------------------------------------------------------------------------
| Home screen
|--------------------------------------------------------------------------
*/

export default function HomeScreen() {
  const {user} = useAuth();

  const member = user?.member ?? user;

  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [homeData, setHomeData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');

  /*
  |--------------------------------------------------------------------------
  | Load Home API
  |--------------------------------------------------------------------------
  */

  const loadHome = useCallback(async () => {
    try {
      setError('');

      const data = await getHomeData();

      setHomeData(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to load profiles.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Initial API request
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  /*
  |--------------------------------------------------------------------------
  | Pull to refresh
  |--------------------------------------------------------------------------
  */

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHome();
  }, [loadHome]);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.muted}>
          Finding your matches...
        </Text>
      </View>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Sections containing profiles
  |--------------------------------------------------------------------------
  */

  const profileSections = sections.filter(
    section =>
      (homeData?.[section.key] || []).length > 0,
  );

  /*
  |--------------------------------------------------------------------------
  | Home UI
  |--------------------------------------------------------------------------
  */

  return (
    <FlatList
      style={styles.container}
      data={profileSections}
      keyExtractor={item => item.key}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}

      /*
      |--------------------------------------------------------------------------
      | Pull to refresh
      |--------------------------------------------------------------------------
      */

      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
        />
      }

      /*
      |--------------------------------------------------------------------------
      | Header
      |--------------------------------------------------------------------------
      */

      ListHeaderComponent={
        <>
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>
                HimRishtey
              </Text>

              <Text style={styles.greeting}>
                Hello, {member?.full_name || 'Member'}
              </Text>
            </View>
          </View>

          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>
              Find Your Perfect Match
            </Text>

            <Text style={styles.bannerSubtitle}>
              Discover meaningful connections
              made for you.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.error}>
                {error}
              </Text>

              <TouchableOpacity
                onPress={loadHome}
                activeOpacity={0.8}>
                <Text style={styles.retry}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </>
      }

      /*
      |--------------------------------------------------------------------------
      | Empty state
      |--------------------------------------------------------------------------
      */

      ListEmptyComponent={
        !error ? (
          <Text style={styles.emptyText}>
            No profiles available right now.
          </Text>
        ) : null
      }

      /*
      |--------------------------------------------------------------------------
      | Render each profile section
      |--------------------------------------------------------------------------
      */

      renderItem={({item}) => (
        <ProfileSection
          title={item.title}
          profiles={homeData?.[item.key] || []}
        />
      )}
    />
  );
}

/*
|--------------------------------------------------------------------------
| Styles
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FF',
  },

  content: {
    paddingBottom: 40,
    flexGrow: 1,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9FF',
  },

  muted: {
    marginTop: 12,
    color: colors.textSecondary,
  },

  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },

  brand: {
    fontSize: 25,
    fontWeight: '800',
    color: colors.primary,
  },

  greeting: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textSecondary,
  },

  banner: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#EDE9FF',
  },

  bannerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },

  bannerSubtitle: {
    marginTop: 10,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  section: {
    marginTop: 20,
    marginBottom: 8,
  },

  sectionHeader: {
    marginHorizontal: 20,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },

  count: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 10,
  },

  profileRow: {
    paddingLeft: 20,
    paddingRight: 8,
  },

  errorBox: {
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
  },

  error: {
    color: '#B42318',
  },

  retry: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: 10,
  },

  emptyText: {
    textAlign: 'center',
    padding: 25,
    color: colors.textSecondary,
  },
});
