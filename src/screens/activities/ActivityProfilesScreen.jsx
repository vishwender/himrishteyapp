import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { getDiscoverProfiles } from '../../api/homeApi';
import ActivityProfileCard from '../../components/ActivityProfileCard';
import colors from '../../theme/colors';

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
          <Text style={styles.empty}>{route.params.section === 'contacts_viewed' ? 'You have not unlocked any available contacts yet.' : 'No profiles found.'}</Text>
        ) : null
      }
      renderItem={({ item }) => (
        <ActivityProfileCard
          member={item}
          activityIcon={route.params.section === 'contacts_viewed' ? 'lock' : route.params.section === 'shortlisted' ? 'bookmark'
            : ['liked_profiles', 'liked_you'].includes(route.params.section) ? 'heart' : 'eye'}
          description={
            route.params.section === 'contacts_viewed' ? 'Contact details unlocked' : route.params.section === 'shortlisted' ? 'Shortlisted profile'
              : route.params.section === 'liked_profiles' ? 'You liked this profile'
                : route.params.section === 'liked_you' ? 'Liked your profile'
                  : 'Viewed your profile'
          }
          onOpenProfile={profileId => navigation.navigate('MemberProfile', {profileId})}
        />
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
  content: { padding: 16 },
  screen: { flex: 1, backgroundColor: '#FAF9FF' },
  empty: { textAlign: 'center', marginTop: 30, color: colors.textSecondary },
  error: { color: '#C43B4B', marginBottom: 12 },
  more: { padding: 16, alignItems: 'center' },
  moreText: { color: colors.primary, fontWeight: '700' },
});
