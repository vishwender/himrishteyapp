import AppIcon from '../AppIcon';

import React, { useId, useState } from 'react';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import {
  View,
  Text,
  Image,
  useWindowDimensions,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';

import {
  Send,
  Clock3,
  CircleCheck,
  CircleX,
  Bookmark,
  BookmarkCheck,
  MapPin,
  LockKeyhole,
} from 'lucide-react-native';

import colors from '../../theme/colors';
import { getProfileImage } from '../../config/images';

// ------------------------------------
// Helpers
// ------------------------------------

function text(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  return String(value);
}

function calculateAge(value) {
  if (!value) {
    return null;
  }

  const date = new Date(String(value).replace(' ', 'T'));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();

  let age = today.getFullYear() - date.getFullYear();

  if (
    today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())
  ) {
    age -= 1;
  }

  return age >= 18 && age <= 100 ? age : null;
}

// ------------------------------------
// Home Member Card
// ------------------------------------

export default function HomeMemberCard({
  member,
  onViewProfile,
  onInterest,
  onShortlist,
  isShortlisted = false,
  interestStatus = null,
  canSendInterest = false,
  onInactiveInterest,
  busy = false,
  matchPercentage = null,
  showMatchPercentage = false,
  cardHeight = null,
}) {
  const { width, fontScale } = useWindowDimensions();
  const gradientId = `portrait-${useId().replace(/:/g, '')}`;
  const [failedPhoto, setFailedPhoto] = useState(null);
  const [photoWidth, setPhotoWidth] = useState(0);
  const [photoSize, setPhotoSize] = useState(null);
  const portraitHeight =
    Math.max(300, cardHeight || Math.min(520, (width - 28) * 1.3)) +
    Math.max(0, fontScale - 1) * 140;
  const profileId = text(member?.profile_id);

  const name = text(member?.full_name) || text(member?.name) || 'Member';
  const profileDetails = [
    { label: 'Education', icon: 'education', value: text(member?.education) },
  ].filter(detail => detail.value);

  const age =
    member?.age !== null && member?.age !== undefined && member?.age !== ''
      ? text(member.age)
      : calculateAge(member?.birth_date_time);

  const city = text(member?.city_living_in) || text(member?.city);

  const state = text(member?.state_living_in) || text(member?.state);

  const location = [city, state]
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .join(', ');

  // Verification status
  const verified = [
    member?.is_verified,
    member?.verified,
    member?.profile_verified,
  ].some(
    value =>
      value === true || value === 1 || String(value).toLowerCase() === 'yes',
  );

  // Member photo
  const imageUrl = member?.photo ? getProfileImage(member.photo) : null;
  // Cover the card while anchoring the original photo's top edge so heads
  // are not cropped by the default vertically centered cover positioning.
  const photoRatio =
    photoSize?.uri === imageUrl && photoSize.width > 0 && photoSize.height > 0
      ? photoSize.width / photoSize.height
      : null;
  const renderedWidth = photoRatio
    ? Math.max(photoWidth, portraitHeight * photoRatio)
    : photoWidth;
  const renderedHeight = photoRatio
    ? renderedWidth / photoRatio
    : portraitHeight;

  // Match percentage
  const score = Number(matchPercentage);

  const hasMatchPercentage =
    showMatchPercentage &&
    matchPercentage !== null &&
    matchPercentage !== undefined &&
    matchPercentage !== '' &&
    Number.isFinite(score) &&
    score >= 0 &&
    score <= 100;

  const status =
    interestStatus === null || interestStatus === undefined
      ? null
      : String(interestStatus);

  const hasInterest = status !== null;

  const interestConfig = {
    0: {
      label: 'Interest Sent',
      Icon: Clock3,
      color: colors.primary,
    },
    1: {
      label: 'Accepted',
      Icon: CircleCheck,
      color: '#16845B',
    },
    2: {
      label: 'Rejected',
      Icon: CircleX,
      color: colors.textSecondary,
    },
  };

  const interestInfo = interestConfig[status];

  const InterestIcon = hasInterest
    ? interestInfo?.Icon || Clock3
    : canSendInterest
    ? Send
    : LockKeyhole;

  const interestLabel = hasInterest
    ? interestInfo?.label || 'Interest Unavailable'
    : canSendInterest
    ? 'Send Interest'
    : 'Activate Profile';

  const interestColor = hasInterest
    ? interestInfo?.color || colors.textSecondary
    : canSendInterest
    ? colors.white
    : colors.primaryDark;

  return (
    <View style={styles.card}>
      {/* Clickable profile section */}
      <View style={styles.cardContent}>
        <View style={styles.mainRow}>
          {/* Member Photo */}
          <View
            style={[styles.photoContainer, { height: portraitHeight }]}
            onLayout={event => setPhotoWidth(event.nativeEvent.layout.width)}
          >
            {imageUrl && failedPhoto !== imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={[
                  styles.photo,
                  {
                    width: renderedWidth || '100%',
                    height: renderedHeight,
                    left: (photoWidth - renderedWidth) / 2,
                  },
                ]}
                resizeMode="cover"
                onLoad={({ nativeEvent }) => {
                  const { width: imageWidth, height: imageHeight } =
                    nativeEvent.source;
                  setPhotoSize({
                    uri: imageUrl,
                    width: imageWidth,
                    height: imageHeight,
                  });
                }}
                onError={() => setFailedPhoto(imageUrl)}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <AppIcon name="user" style={styles.placeholderIcon} />
              </View>
            )}

            {hasMatchPercentage ? (
              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>
                  {Math.round(score)}% Match
                </Text>
              </View>
            ) : null}

            {verified ? (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : null}

            <View pointerEvents="none" style={styles.photoShade}>
              <Svg width="100%" height={portraitHeight} accessible={false}>
                <Defs>
                  <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#171027" stopOpacity="0" />
                    <Stop offset="0.35" stopColor="#171027" stopOpacity="0" />
                    <Stop
                      offset="0.55"
                      stopColor="#171027"
                      stopOpacity="0.10"
                    />
                    <Stop
                      offset="0.72"
                      stopColor="#171027"
                      stopOpacity="0.30"
                    />
                    <Stop
                      offset="0.88"
                      stopColor="#171027"
                      stopOpacity="0.48"
                    />
                    <Stop offset="1" stopColor="#171027" stopOpacity="0.65" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
              </Svg>
            </View>

            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={onViewProfile}
              accessible={false}
            />
            {/* Member information */}
            <View style={styles.profileInfo} pointerEvents="box-none">
              <Pressable
                onPress={onViewProfile}
                accessibilityRole="button"
                accessibilityLabel={`View profile of ${name}`}
              >
                {/* Profile ID + Match */}
                {profileId ? (
                  <View style={styles.topRow}>
                    <View style={styles.profileIdBadge}>
                      <Text style={styles.profileId}>{profileId}</Text>
                    </View>
                  </View>
                ) : null}

                {/* Name */}
                <Text style={styles.memberName} numberOfLines={2}>
                  {name}
                  {age ? `, ${age}` : ''}
                </Text>

                {/* Location */}
                {location ? (
                  <View style={styles.detailRow}>
                    <MapPin size={13} color={colors.white} />

                    <Text style={styles.detailText} numberOfLines={2}>
                      {location}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.profileDetails}>
                  {profileDetails.map(detail => (
                    <View key={detail.label} style={styles.profileDetailRow}>
                      <AppIcon
                        name={detail.icon}
                        size={16}
                        color={colors.white}
                      />
                      <Text
                        style={styles.detailText}
                        numberOfLines={2}
                        accessibilityLabel={`${detail.label}: ${detail.value}`}
                      >
                        {detail.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </Pressable>
              <View style={styles.actions}>
                {/* Send Interest */}

                <TouchableOpacity
                  style={[
                    styles.interestButton,
                    (hasInterest || !canSendInterest) &&
                      styles.interestStatusButton,
                    busy && styles.disabledButton,
                  ]}
                  onPress={
                    hasInterest
                      ? onViewProfile
                      : canSendInterest
                      ? onInterest
                      : onInactiveInterest
                  }
                  disabled={busy}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={interestLabel}
                  accessibilityState={{ disabled: busy }}
                >
                  <InterestIcon
                    size={17}
                    color={interestColor}
                    strokeWidth={2}
                  />

                  <Text
                    style={[
                      styles.interestText,
                      (hasInterest || !canSendInterest) && {
                        color: interestColor,
                      },
                    ]}
                  >
                    {interestLabel}
                  </Text>
                </TouchableOpacity>

                {/* Shortlist */}
                <TouchableOpacity
                  style={[
                    styles.shortlistButton,
                    isShortlisted && styles.shortlistedButton,
                    busy && styles.disabledButton,
                  ]}
                  onPress={onShortlist}
                  disabled={busy}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isShortlisted
                      ? 'Remove from shortlist'
                      : 'Shortlist profile'
                  }
                  accessibilityState={{
                    selected: isShortlisted,
                    disabled: busy,
                  }}
                >
                  {isShortlisted ? (
                    <BookmarkCheck
                      size={18}
                      color={colors.white}
                      strokeWidth={2}
                    />
                  ) : (
                    <Bookmark size={18} color={colors.white} strokeWidth={2} />
                  )}

                  <Text
                    style={[
                      styles.shortlistText,
                      isShortlisted && styles.selectedText,
                    ]}
                  >
                    {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ------------------------------------
// Styles
// ------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 20,

    elevation: 2,

    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 8,
  },

  cardContent: {
    overflow: 'hidden',
  },

  mainRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  photoContainer: {
    width: '100%',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: colors.primaryLight,
    position: 'relative',
  },

  photo: {
    position: 'absolute',
    top: 0,
  },

  photoPlaceholder: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeholderIcon: {
    fontSize: 45,
  },

  verifiedBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#079D69',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },

  verifiedText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },

  profileInfo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 10,
  },

  profileIdBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  profileId: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },

  matchBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  matchBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },

  memberName: {
    color: colors.white,
    fontSize: 25,
    fontWeight: '800',
    marginBottom: 9,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 0,
  },

  detailText: {
    flex: 1,
    color: colors.white,
    fontSize: 13,
    lineHeight: 20,
  },

  profileDetails: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
  },

  profileDetailRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },

  photoShade: {
    ...StyleSheet.absoluteFill,
  },

  // Action buttons

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },

  interestButton: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: colors.primary,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  interestText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
  },

  shortlistButton: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 14,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  shortlistedButton: {
    backgroundColor: 'rgba(103, 61, 230, 0.65)',
  },

  shortlistText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'center',
  },

  selectedText: {
    color: colors.white,
  },

  disabledButton: {
    opacity: 0.5,
  },

  interestStatusButton: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
