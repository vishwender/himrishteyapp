
import React, {memo} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import colors from '../theme/colors';
import {getProfileImage} from '../config/images';

function MemberCard({member, onPress}) {
  const imageURL = getProfileImage(member.photo);

  const initials = (member.full_name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();

  const location = [
    member.city_living_in,
    member.state_living_in,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onPress?.(member)}>

      <View style={styles.imageContainer}>
        {imageURL ? (
          <Image
            source={{uri: imageURL}}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.initials}>
              {initials}
            </Text>
          </View>
        )}

        {member.member_type === 'Verified' && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>
              ✓ Verified
            </Text>
          </View>
        )}

        {member.match_percentage != null && (
          <View style={styles.matchBadge}>
            <Text style={styles.matchText}>
              {member.match_percentage}% Match
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {member.full_name}
        </Text>

        <Text style={styles.details}>
          {member.age ?? '—'} yrs
          {'  •  '}
          {member.height || '—'}
        </Text>

        <Text style={styles.location} numberOfLines={1}>
          {location || 'Location not specified'}
        </Text>

        <Text style={styles.profileId}>
          {member.profile_id}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default memo(MemberCard);

const styles = StyleSheet.create({
  card: {
    width: 184,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEAF7',
  },
  imageContainer: {
    width: '100%',
    height: 205,
    backgroundColor: '#EDE9FF',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 10,
    left: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  verifiedText: {
    color: '#16A068',
    fontSize: 10,
    fontWeight: '700',
  },
  matchBadge: {
    position: 'absolute',
    bottom: 10,
    right: 8,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  matchText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  details: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 12,
  },
  location: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 12,
  },
  profileId: {
    marginTop: 8,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
});
