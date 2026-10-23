import AppIcon from '../AppIcon';

import React from 'react';

import {
    View,
    Text,
    Image,
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
    GraduationCap,
    BriefcaseBusiness,
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
        (today.getMonth() === date.getMonth() &&
            today.getDate() < date.getDate())
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
}) {
    const profileId = text(member?.profile_id);

    const name =
        text(member?.full_name) ||
        text(member?.name) ||
        'Member';

    const age =
        member?.age !== null &&
            member?.age !== undefined &&
            member?.age !== ''
            ? text(member.age)
            : calculateAge(member?.birth_date_time);

    const city =
        text(member?.city_living_in) ||
        text(member?.city);

    const state =
        text(member?.state_living_in) ||
        text(member?.state);

    const location = [city, state]
        .filter(Boolean)
        .filter((value, index, array) => array.indexOf(value) === index)
        .join(', ');

    const height = text(member?.height);
    const religion = text(member?.religion);
    const caste = text(member?.cast || member?.caste);
    const education = text(member?.education);
    const occupation = text(member?.occupation);

    // Verification status
    const verified = [
        member?.is_verified,
        member?.verified,
        member?.profile_verified,
    ].some(
        value =>
            value === true ||
            value === 1 ||
            String(value).toLowerCase() === 'yes',
    );

    // Member photo
    const imageUrl = member?.photo
        ? getProfileImage(member.photo)
        : null;

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

    const details = [
        height,
        religion,
        caste,
    ].filter(Boolean);

    const status =
        interestStatus === null ||
            interestStatus === undefined
            ? null
            : String(interestStatus);

    const hasInterest = status !== null;

    const interestConfig = {
        '0': {
            label: 'Interest Sent',
            Icon: Clock3,
            color: colors.primary,
        },
        '1': {
            label: 'Accepted',
            Icon: CircleCheck,
            color: '#16845B',
        },
        '2': {
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
            <Pressable
                onPress={onViewProfile}
                accessibilityRole="button"
                accessibilityLabel={`View profile of ${name}`}
                style={({ pressed }) => [
                    styles.cardContent,
                    pressed && styles.pressedContent,
                ]}>

                <View style={styles.mainRow}>

                    {/* Member Photo */}
                    <View style={styles.photoContainer}>
                        {imageUrl ? (
                            <Image
                                source={{ uri: imageUrl }}
                                style={styles.photo}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <AppIcon name="user" style={styles.placeholderIcon} />
                            </View>
                        )}

                        {verified ? (
                            <View style={styles.verifiedBadge}>
                                <Text style={styles.verifiedText}>
                                    Verified
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Member information */}
                    <View style={styles.profileInfo}>

                        {/* Profile ID + Match */}
                        <View style={styles.topRow}>
                            {profileId ? (
                                <View style={styles.profileIdBadge}>
                                    <Text style={styles.profileId}>
                                        {profileId}
                                    </Text>
                                </View>
                            ) : null}

                            {hasMatchPercentage ? (
                                <View style={styles.matchBadge}>
                                    <Text style={styles.matchBadgeText}>
                                        {Math.round(score)}% Match
                                    </Text>
                                </View>
                            ) : null}
                        </View>

                        {/* Name */}
                        <Text
                            style={styles.memberName}
                            numberOfLines={2}>
                            {name}{age ? `, ${age}` : ''}
                        </Text>

                        {/* Location */}
                        {location ? (
                            <View style={styles.detailRow}>
                                <MapPin
                                    size={13}
                                    color={colors.textSecondary}
                                />

                                <Text
                                    style={styles.detailText}
                                    numberOfLines={2}>
                                    {location}
                                </Text>
                            </View>
                        ) : null}

                        {/* Height, Religion, Caste */}
                        {details.length > 0 ? (
                            <Text
                                style={styles.detailsLine}
                                numberOfLines={2}>
                                {details.join('  ·  ')}
                            </Text>
                        ) : null}

                        {/* Education */}
                        {education ? (
                            <View style={styles.detailRow}>
                                <GraduationCap
                                    size={13}
                                    color={colors.textSecondary}
                                />

                                <Text
                                    style={styles.detailText}
                                    numberOfLines={2}>
                                    {education}
                                </Text>
                            </View>
                        ) : null}

                        {/* Occupation */}
                        {occupation ? (
                            <View style={styles.detailRow}>
                                <BriefcaseBusiness
                                    size={13}
                                    color={colors.textSecondary}
                                />

                                <Text
                                    style={styles.detailText}
                                    numberOfLines={2}>
                                    {occupation}
                                </Text>
                            </View>
                        ) : null}

                    </View>
                </View>
            </Pressable>

            {/* --------------------------------
          Action Buttons
      -------------------------------- */}

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
                    accessibilityLabel={interestLabel}>

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
                        numberOfLines={1}>
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
                    }}>

                    {isShortlisted ? (
                        <BookmarkCheck
                            size={18}
                            color={colors.primaryDark}
                            strokeWidth={2}
                        />
                    ) : (
                        <Bookmark
                            size={18}
                            color={colors.primary}
                            strokeWidth={2}
                        />
                    )}

                    <Text
                        style={[
                            styles.shortlistText,
                            isShortlisted && styles.selectedText,
                        ]}>
                        {isShortlisted
                            ? 'Shortlisted'
                            : 'Shortlist'}
                    </Text>

                </TouchableOpacity>

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
        borderRadius: 18,
        padding: 12,
        marginBottom: 14,

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
        borderRadius: 12,
    },

    pressedContent: {
        opacity: 0.8,
    },

    mainRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },

    photoContainer: {
        width: 128,
        height: 178,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: colors.primaryLight,
        position: 'relative',
    },

    photo: {
        width: '100%',
        height: '100%',
    },

    photoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    placeholderIcon: {
        fontSize: 45,
    },

    verifiedBadge: {
        position: 'absolute',
        bottom: 7,
        left: 7,
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
        flex: 1,
        minWidth: 0,
        paddingLeft: 11,
        paddingTop: 2,
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
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 7,
        paddingVertical: 5,
        borderRadius: 7,
    },

    profileId: {
        color: colors.primaryDark,
        fontSize: 10,
        fontWeight: '800',
    },

    matchBadge: {
        backgroundColor: colors.primary,
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 6,
        marginLeft: 'auto',
    },

    matchBadgeText: {
        color: colors.white,
        fontSize: 9,
        fontWeight: '800',
    },

    memberName: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 9,
    },

    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginBottom: 7,
    },

    detailText: {
        flex: 1,
        color: colors.textSecondary,
        fontSize: 11,
        lineHeight: 17,
    },

    detailsLine: {
        color: colors.textSecondary,
        fontSize: 11,
        lineHeight: 18,
        marginBottom: 7,
    },

    // Action buttons

    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },

    interestButton: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        backgroundColor: colors.primary,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },

    interestText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '700',
    },

    shortlistButton: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: colors.white,
        borderRadius: 10,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },

    shortlistedButton: {
        backgroundColor: colors.primaryLight,
    },

    shortlistText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },

    selectedText: {
        color: colors.primaryDark,
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
