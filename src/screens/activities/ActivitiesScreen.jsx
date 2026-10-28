import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../../components/AppIcon';
import { getActivityCounts } from '../../api/activityApi';
import colors from '../../theme/colors';

const rows = [
  ['viewers', 'Who Viewed My Profile', 'See who’s interested in you', 'eye'],
  ['received', 'Interests Received', 'Manage incoming requests', 'heart'],
  ['sent', 'Interests Sent', 'Track your requests', 'send'],
  ['likes', 'Likes', 'Liked profiles and people who liked you', 'heart'],
  ['shortlisted', 'Shortlisted Profiles', 'Your saved matches', 'bookmark'],
];

export default function ActivitiesScreen({ navigation }) {
  const bottom = useBottomTabBarHeight();
  const request = useRef(0);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    try {
      const result = await getActivityCounts();
      if (id !== request.current) return;
      setCounts(result.counts);
      setError(
        result.failed
          ? 'Some activity counts are unavailable. Pull down or tap Retry.'
          : '',
      );
    } catch (err) {
      if (id === request.current) {
        setCounts({});
        setError(err.message || 'Unable to load activity.');
      }
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
      return () => {
        request.current += 1;
      };
    }, [load]),
  );
  const open = key => {
    if (key === 'likes') {
      navigation.navigate('ActivityLikes');
      return;
    }
    if (key === 'viewers' || key === 'shortlisted') {
      navigation.navigate('ActivityProfiles', {
        section: key === 'viewers' ? 'viewed_you' : 'shortlisted',
        title:
          key === 'viewers' ? 'Who Viewed My Profile' : 'Shortlisted Profiles',
      });
    } else navigation.navigate('ActivityInterests', { tab: key });
  };
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottom + 24 }]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            colors={[colors.primary]}
          />
        }
      >
        <Text style={styles.title}>My Activity</Text>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.subtitle}>{error}</Text>
            <TouchableOpacity accessibilityRole="button" onPress={load}>
              <Text style={styles.retry}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={styles.card}>
          {rows.map(([key, title, subtitle, icon], index) => (
            <TouchableOpacity
              key={key}
              accessibilityRole="button"
              style={[styles.row, index < rows.length - 1 && styles.divider]}
              onPress={() => open(key)}
            >
              <View style={styles.icon}>
                <AppIcon name={icon} size={21} />
              </View>
              <View style={styles.info}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
              {key === 'likes' ? null : loading ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={styles.count}>{counts[key] ?? '—'}</Text>
              )}
              <AppIcon name="next" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF9FF' },
  content: { padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E9E3F0',
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 22,
    gap: 10,
    minHeight: 80,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E9E3F0',
  },
  icon: { backgroundColor: '#F2EDFF', borderRadius: 12, padding: 9 },
  info: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 11, color: colors.textSecondary, marginTop: 5 },
  count: { fontSize: 16, fontWeight: '700', color: colors.text },
  errorBox: { marginBottom: 12 },
  retry: { color: colors.primary, paddingVertical: 10, fontWeight: '700' },
});
