import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { getDiscoverProfiles } from '../../api/homeApi';
import AppIcon from '../../components/AppIcon';
import VerifiedBadge from '../../components/VerifiedBadge';
import colors from '../../theme/colors';
import { getProfileImage } from '../../config/images';

export default function ActivityProfilesScreen({ route, navigation }) {
  const bottom = useBottomTabBarHeight();
  const [profiles, setProfiles] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const busy = useRef(false);
  const load = useCallback(
    async (next = null) => {
      if (busy.current) return;
      busy.current = true;
      const id = ++sequence.current;
      setLoading(true);
      setError('');
      try {
        const result = await getDiscoverProfiles({
          section: route.params.section,
          cursor: next,
        });
        if (id !== sequence.current) return;
        setProfiles(previous => [
          ...new Map(
            [...(next ? previous : []), ...result.profiles].map(item => [
              item.id,
              item,
            ]),
          ).values(),
        ]);
        setCursor(result.nextCursor);
      } catch (err) {
        if (id === sequence.current)
          setError(err.message || 'Unable to load profiles.');
      } finally {
        if (id === sequence.current) {
          busy.current = false;
          setLoading(false);
        }
      }
    },
    [route.params.section],
  );
  useFocusEffect(
    useCallback(() => {
      load();
      return () => {
        sequence.current += 1;
        busy.current = false;
      };
    }, [load]),
  );
  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: bottom + 24 }]}
      data={profiles}
      keyExtractor={item => String(item.id)}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => load()}
          colors={[colors.primary]}
        />
      }
      ListHeaderComponent={
        error ? <Text style={styles.error}>{error}</Text> : null
      }
      ListEmptyComponent={
        !loading && !error ? (
          <Text style={styles.empty}>No profiles found.</Text>
        ) : null
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          accessibilityRole="button"
          style={
            [
              'viewed_you',
              'liked_profiles',
              'liked_you',
              'shortlisted',
            ].includes(route.params.section)
              ? styles.viewerCard
              : styles.card
          }
          disabled={!item.profile_id}
          onPress={() =>
            navigation.navigate('MemberProfile', { profileId: item.profile_id })
          }
        >
          {[
            'viewed_you',
            'liked_profiles',
            'liked_you',
            'shortlisted',
          ].includes(route.params.section) ? (
            <>
              <View style={styles.photoBox}>
                {getProfileImage(item.photo) ? (
                  <Image
                    source={{ uri: getProfileImage(item.photo) }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.initials}>
                    {(item.full_name || '?')
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map(word => word[0])
                      .join('')
                      .toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.memberInfo}>
                <Text numberOfLines={1} style={styles.name}>
                  {item.full_name || 'Profile unavailable'}
                </Text>
                <VerifiedBadge member={item} />
                <Text style={styles.profileId}>
                  {item.profile_id || 'Unknown profile'}
                </Text>
                <Text numberOfLines={1} style={styles.location}>
                  {[item.city_living_in, item.state_living_in]
                    .filter(Boolean)
                    .join(', ') || 'Location not specified'}
                </Text>
                <Text style={styles.direction}>
                  {route.params.section === 'shortlisted'
                    ? 'Shortlisted profile'
                    : route.params.section === 'liked_profiles'
                    ? 'You liked this profile'
                    : route.params.section === 'liked_you'
                    ? 'Liked your profile'
                    : 'Viewed your profile'}
                </Text>
              </View>
            </>
          ) : (
            <>
              <AppIcon name="user" />
              <View style={styles.info}>
                <Text style={styles.name}>
                  {item.full_name || item.profile_id || 'Member'}
                </Text>
                <VerifiedBadge member={item} />
                <Text style={styles.location}>
                  {[item.city_living_in, item.state_living_in]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
              <AppIcon name="next" size={18} />
            </>
          )}
        </TouchableOpacity>
      )}
      ListFooterComponent={
        loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : error || cursor ? (
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.more}
            onPress={() => load(cursor)}
          >
            <Text style={styles.moreText}>{error ? 'Retry' : 'Load More'}</Text>
          </TouchableOpacity>
        ) : null
      }
    />
  );
}
const styles = StyleSheet.create({
  viewerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEAF7',
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
  photo: { width: '100%', height: '100%' },
  initials: { fontSize: 23, fontWeight: '700', color: colors.primary },
  memberInfo: { flex: 1, paddingLeft: 14 },
  profileId: { fontSize: 12, color: colors.primary, marginTop: 4 },
  direction: { fontSize: 11, color: colors.textSecondary, marginTop: 5 },
  content: { padding: 16 },
  screen: { flex: 1, backgroundColor: '#FAF9FF' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  location: { fontSize: 12, color: colors.textSecondary, marginTop: 5 },
  empty: { textAlign: 'center', marginTop: 30, color: colors.textSecondary },
  error: { color: '#C43B4B', marginBottom: 12 },
  more: { padding: 16, alignItems: 'center' },
  moreText: { color: colors.primary, fontWeight: '700' },
});
