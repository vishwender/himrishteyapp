import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import AppIcon from '../../components/AppIcon';
import colors from '../../theme/colors';

export default function LikesScreen({ navigation }) {
  const bottom = useBottomTabBarHeight();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: bottom + 24 }]}
    >
      {[
        ['liked_profiles', 'Liked Profiles', 'Profiles you liked', 'heart'],
        [
          'liked_you',
          'Who Liked My Profile',
          'See who liked your profile',
          'user',
        ],
      ].map(([section, title, subtitle, icon]) => (
        <TouchableOpacity
          key={section}
          accessibilityRole="button"
          style={styles.row}
          onPress={() =>
            navigation.navigate('ActivityProfiles', { section, title })
          }
        >
          <View style={styles.icon}>
            <AppIcon name={icon} />
          </View>
          <View style={styles.info}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <AppIcon name="next" size={18} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF9FF' },
  content: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9E3F0',
    padding: 18,
    marginBottom: 12,
  },
  icon: { backgroundColor: '#F2EDFF', padding: 9, borderRadius: 12 },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 11, color: colors.textSecondary, marginTop: 5 },
});
