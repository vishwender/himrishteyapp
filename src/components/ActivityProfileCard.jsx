import React from 'react';
import ProfileImage from './ProfileImage';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import VerifiedBadge from './VerifiedBadge';
import AppIcon from './AppIcon';
import {getProfileImage} from '../config/images';
import colors from '../theme/colors';

export default function ActivityProfileCard({member, description, activityIcon = 'activities', onOpenProfile, children}) {
  const imageURL = getProfileImage(member?.photo);
  const name = member?.full_name?.trim() || 'Profile unavailable';
  const age = Number(member?.age);
  const displayName = Number.isInteger(age) && age > 0
    ? `${name}, ${age}` : name;
  const canOpen = Boolean(member?.profile_id && onOpenProfile);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`View profile: ${displayName}`}
        accessibilityState={{disabled: !canOpen}}
        style={styles.row}
        activeOpacity={0.8}
        disabled={!canOpen}
        onPress={() => onOpenProfile(member.profile_id)}>
        <View style={styles.photoBox}>
          <ProfileImage uri={imageURL} gender={member?.gender} style={styles.photo} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{displayName}</Text>
          <VerifiedBadge member={member} />
          <View style={styles.detailRow}>
            <AppIcon name="user" size={14} color={colors.primary} style={styles.detailIcon} />
            <Text style={styles.profileId}>{member?.profile_id || 'Unknown profile'}</Text>
          </View>
          <View style={styles.detailRow}>
            <AppIcon name="location" size={14} color={colors.textSecondary} style={styles.detailIcon} />
            <Text style={styles.detailText}>
              {[member?.city_living_in, member?.state_living_in].filter(Boolean).join(', ') || 'Location not specified'}
            </Text>
          </View>
          {description ? (
            <View style={styles.detailRow}>
              <AppIcon name={activityIcon} size={14} color={colors.textSecondary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{description}</Text>
            </View>
          ) : null}
        </View>
        <AppIcon name="next" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#EEEAF7'},
  row: {flexDirection: 'row', alignItems: 'center', minHeight: 82},
  photoBox: {width: 72, height: 82, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'},
  photo: {width: '100%', height: '100%'},
  initials: {fontSize: 23, fontWeight: '700', color: colors.primary},
  info: {flex: 1, paddingLeft: 14},
  name: {fontSize: 16, fontWeight: '700', color: colors.text},
  detailRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 5},
  detailIcon: {marginTop: 2},
  profileId: {flex: 1, fontSize: 12, lineHeight: 18, color: colors.primary},
  detailText: {flex: 1, fontSize: 12, lineHeight: 18, color: colors.textSecondary},
});
