import ProfilePhoto from '../../components/ProfilePhoto';
import AppIcon from '../../components/AppIcon';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, } from 'react-native';

import { getMemberProfile } from '../../api/memberApi';
import { notifyShortlistChanged, } from '../../services/shortlistSync';
import { checkShortlist, addToShortlist, removeFromShortlist, } from '../../api/shortlistApi';
import { checkSentInterest, sendInterest, cancelInterest, } from '../../api/interestApi';
import { getProfileImage } from '../../config/images';
import colors from '../../theme/colors';

import { useAuth } from '../../context/AuthContext';

import {
  notifyInterestChanged,
  subscribeInterestChanges,
} from '../../services/interestSync';

function display(value) {
  if (value === null || value === undefined) return '';
  const result = String(value).trim();
  return result === 'null' || result === 'undefined' ? '' : result;
}

function getAge(dateValue) {
  if (!dateValue) return null;
  const datePart = String(dateValue).split(/[ T]/)[0];
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(datePart);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const birthday = new Date(year, month, day);
  if (birthday.getFullYear() !== year || birthday.getMonth() !== month || birthday.getDate() !== day) {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() < month || (today.getMonth() === month && today.getDate() < day)) age -= 1;
  return age >= 18 && age <= 120 ? age : null;
}

function errorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
}

function verifiedMember(member) {
  // Only display the badge when the API explicitly says the profile is verified.
  return [member?.is_verified, member?.verified, member?.profile_verified].some(
    value => value === true || value === 1 || String(value).trim().toLowerCase() === 'yes',
  );
}

function DetailRow({ label, value }) {
  const text = display(value);
  if (!text) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{text}</Text>
    </View>
  );
}

function DetailCard({ title, icon, items, description, showWhenEmpty = false, showMissingValues = false }) {
  const visibleItems = showMissingValues
    ? items.map(item => ({ ...item, value: display(item.value) || "Not specified" }))
    : items.filter(item => display(item.value));
  const visibleDescription = display(description);
  if (!showWhenEmpty && !visibleItems.length && !visibleDescription) return null;

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionIcon}><AppIcon name={icon} size={18} /></View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {visibleDescription ? <Text style={styles.sectionDescription}>{visibleDescription}</Text> : null}
      {visibleItems.map(item => <DetailRow key={item.label} label={item.label} value={item.value} />)}
      {showWhenEmpty && !visibleItems.length && !visibleDescription ? (
        <Text style={styles.sectionDescription}>Not specified</Text>
      ) : null}
    </View>
  );
}

function StatPill({ label, value, icon }) {
  if (!display(value)) return null;
  return (
    <View style={styles.statPill}>
      <AppIcon name={icon} style={styles.statIcon} />
      <Text numberOfLines={2} style={styles.statValue}>{String(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function interestLabel(interest) {
  if (!interest?.sent) return 'Send Interest';
  switch (String(interest?.interest?.status)) {
    case '0': return 'Cancel Interest';
    case '1': return 'Accepted';
    case '2': return 'Interest Rejected';
    default: return 'Interest Unavailable';
  }
}

export default function MemberProfileScreen({ route, navigation }) {
  const { canSendInterest } = useAuth();

  const profileId = route?.params?.profileId;
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [shortlisted, setShortlisted] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(true);
  const [shortlistSaving, setShortlistSaving] = useState(false);
  const [shortlistError, setShortlistError] = useState('');

  const [interest, setInterest] = useState(null);
  const [interestLoading, setInterestLoading] = useState(true);
  const [interestSaving, setInterestSaving] = useState(false);
  const [interestError, setInterestError] = useState('');
  const interestRevision = useRef(0);
  const interestMutation = useRef(false);

  useEffect(() => subscribeInterestChanges(event => {
    if (String(event.memberId) !== String(member?.id)) return;
    interestRevision.current += 1;
    setInterest(event.interestStatus === null
      ? {sent: false, interest: null}
      : {sent: true, interest: {id: event.interestId, status: event.interestStatus}});
    setInterestError('');
  }), [member?.id]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      setMember(null);
      setShortlisted(false);
      setShortlistLoading(true);
      setShortlistError('');
      setInterest(null);
      setInterestLoading(true);
      setInterestError('');
      try {
        if (!profileId) throw new Error('Profile ID is missing.');
        const profile = await getMemberProfile(profileId);
        if (!active) return;
        setMember(profile);
        setLoading(false);

        if (!profile?.id) {
          setShortlistError('Member ID unavailable.');
          setInterestError('Member ID unavailable.');
          return;
        }
        const revision = interestRevision.current;
        const [shortlistResult, interestResult] = await Promise.allSettled([
          checkShortlist(profile.id),
          checkSentInterest(profile.id),
        ]);
        if (!active) return;
        if (shortlistResult.status === 'fulfilled') {
          setShortlisted(Boolean(shortlistResult.value));
        } else {
          setShortlistError(errorMessage(shortlistResult.reason));
        }
        if (interestRevision.current !== revision) return;
        if (interestResult.status === 'fulfilled') {
          const result = interestResult.value;
          setInterest(result);
          notifyInterestChanged(
            profile.id,
            result.sent ? result.interest?.status : null,
            result.interest?.id ?? null,
          );
        } else {
          setInterestError(errorMessage(interestResult.reason));
        }
      } catch (err) {
        if (active) {
          setError(errorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
          setShortlistLoading(false);
          setInterestLoading(false);
        }
      }
    };
    load();
    return () => { active = false; };
    // The profile should reload when the selected profile ID changes.
  }, [profileId]);

  const retryShortlist = useCallback(async () => {
    if (!member?.id || shortlistLoading || shortlistSaving) return;
    setShortlistLoading(true);
    setShortlistError('');
    try {
      setShortlisted(Boolean(await checkShortlist(member.id)));
    } catch (err) {
      setShortlistError(errorMessage(err));
    } finally {
      setShortlistLoading(false);
    }
  }, [member?.id, shortlistLoading, shortlistSaving]);

  const retryInterest = useCallback(async () => {
    if (!member?.id || interestLoading || interestSaving) return;
    setInterestLoading(true);
    setInterestError('');
    const revision = interestRevision.current;
    try {
      const result = await checkSentInterest(member.id);
      if (interestRevision.current === revision) {
        setInterest(result);
        notifyInterestChanged(
          member.id,
          result.sent ? result.interest?.status : null,
          result.interest?.id ?? null,
        );
      }
    } catch (err) {
      setInterestError(errorMessage(err));
    } finally {
      setInterestLoading(false);
    }
  }, [member?.id, interestLoading, interestSaving]);

  const toggleShortlist = useCallback(async () => {
    if (
      !member?.id ||
      shortlistLoading ||
      shortlistSaving ||
      shortlistError
    ) {
      return;
    }

    setShortlistSaving(true);

    try {
      const updated = shortlisted
        ? await removeFromShortlist(member.id)
        : await addToShortlist(member.id);

      if (typeof updated !== 'boolean') {
        throw new Error('Unable to confirm shortlist status.');
      }

      // Update the Member Profile screen.
      setShortlisted(updated);

      // Synchronize bookmarks across all Home tabs.
      notifyShortlistChanged(member.id, updated);

    } catch (err) {
      Alert.alert('Shortlist', errorMessage(err));
    } finally {
      setShortlistSaving(false);
    }
  }, [
    member?.id,
    shortlisted,
    shortlistLoading,
    shortlistSaving,
    shortlistError,
  ]);

  const handleSendInterest = useCallback(async () => {
    if (!canSendInterest) {
      Alert.alert(
        'Activate Profile',
        'Only active members can send interests.',
      );
      return;
    }
    if (!member?.id || interestLoading || interestSaving || interestError || interest?.sent || interestMutation.current) return;
    interestMutation.current = true;
    setInterestSaving(true);
    try {
      // Preserve existing working API contract: interest functions use numeric member.id.
      const result = await sendInterest(member.id);
      if (result?.sent !== true) throw new Error('Interest creation was not confirmed.');
      setInterest({ sent: result.sent === true, interest: { id: result.id, status: result.status } });
      Alert.alert('Interest Sent', 'Your interest has been sent successfully.');
      if (result.sent === true) {
        notifyInterestChanged(
          member.id,
          String(result.status ?? '0'),
          result.id ?? null,
        );
      }
    } catch (err) {
      Alert.alert('Unable to Send Interest', errorMessage(err));
      // A timeout may occur after a successful server-side send: require status recheck.
      setInterestError('Please check interest status before retrying.');
    } finally {
      interestMutation.current = false;
      setInterestSaving(false);
    }
  }, [canSendInterest, member?.id, interestLoading, interestSaving, interestError, interest?.sent]);

  const handleCancelInterest = useCallback(() => {
    const id = interest?.interest?.id;
    if (!id || interestLoading || interestSaving || interestError || String(interest?.interest?.status) !== '0') return;
    Alert.alert('Cancel Interest', 'Cancel your pending interest request?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Interest',
        style: 'destructive',
        onPress: async () => {
          if (interestMutation.current) return;
          interestMutation.current = true;
          setInterestSaving(true);
          try {
            const result = await cancelInterest(id);
            if (result?.cancelled !== true) throw new Error('Interest cancellation was not confirmed.');
            setInterest({ sent: false, interest: null });
            notifyInterestChanged(
              member.id,
              null,
              null,
            );
            Alert.alert('Interest Cancelled', 'Your interest was cancelled successfully.');
          } catch (err) {
            Alert.alert('Unable to Cancel', errorMessage(err));
            setInterestError('Please check interest status before retrying.');
          } finally {
            interestMutation.current = false;
            setInterestSaving(false);
          }
        },
      },
    ]);
  }, [member?.id, interest?.interest?.id, interest?.interest?.status, interestLoading, interestSaving, interestError]);

  const handleUnlockContact = useCallback(() => {
    // Never reveal contact details from the ordinary profile response.
    // A future backend endpoint must authorize and record contact unlocks.
    Alert.alert(
      'Contact Details Locked',
      'Contact unlocking is not connected yet. Contact information will remain hidden until the server confirms access.',
      [
        { text: 'OK', style: 'cancel' },
        {
          text: 'View Membership Plans',
          onPress: () => {
            const parent = navigation?.getParent?.();
            if (parent?.navigate) {
              parent.navigate('Membership');
            } else {
              navigation?.navigate?.('Membership');
            }
          },
        },
      ],
    );
  }, [navigation]);

  const age = useMemo(() => getAge(member?.birth_date_time), [member?.birth_date_time]);
  const location = useMemo(() => [member?.city_living_in, member?.state_living_in, member?.country_living_in].map(display).filter(Boolean).join(', '), [member?.city_living_in, member?.state_living_in, member?.country_living_in]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.muted}>Loading profile...</Text></View>;
  }
  if (error || !member) {
    return <View style={styles.center}><Text style={styles.errorText}>{error || 'Profile unavailable.'}</Text></View>;
  }

  const photo = member.photo ? getProfileImage(member.photo) : null;
  const canCancel = interest?.sent === true && String(interest?.interest?.status) === '0';
  const interestDisabled = interestLoading || interestSaving || Boolean(interestError) || (interest?.sent === true && !canCancel);
  const shortlistDisabled = shortlistLoading || shortlistSaving || Boolean(shortlistError);

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {photo ? (
            <ProfilePhoto uri={photo} style={styles.heroPhoto} accessibilityLabel="Member profile photo" />
          ) : (
            <View style={styles.noPhoto}><AppIcon name="user" style={styles.noPhotoIcon} /><Text style={styles.noPhotoText}>Photo not available</Text></View>
          )}
          <View style={styles.photoTopRow} pointerEvents="none">
            {verifiedMember(member) ? <View style={styles.verifyBadge}><Text style={styles.verifyText}>Verified Profile</Text></View> : <View />}
            <View style={styles.idBadge}><Text style={styles.idText}>{display(member.profile_id)}</Text></View>
          </View>
          <TouchableOpacity
            style={[styles.likeButton, shortlisted && styles.likeButtonActive, shortlistDisabled && styles.disabledAction]}
            onPress={toggleShortlist}
            disabled={shortlistDisabled}
            accessibilityRole="button"
            accessibilityLabel={shortlisted ? 'Remove from shortlist' : 'Shortlist profile'}
            accessibilityHint="Save this member to your shortlist"
            activeOpacity={0.85}>
            {shortlistLoading || shortlistSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <AppIcon name={shortlisted ? "saved" : "bookmark"} size={24} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.summaryCard}>
            <Text style={styles.memberName}>{display(member.full_name) || 'Member'}{age !== null ? `, ${age}` : ''}</Text>
            <Text style={styles.location}>{location ? `${location}` : 'Location not specified'}</Text>
            <View style={styles.statsRow}>
              <StatPill icon="height" label="Height" value={member.height} />
              <StatPill icon="education" label="Education" value={member.education} />
              <StatPill icon="work" label="Profession" value={member.occupation} />
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionIcon}><AppIcon name="heart" style={styles.sectionIconText} /></View>
              <Text style={styles.sectionTitle}>About Me</Text>
            </View>
            <Text style={styles.about}>
              {display(member.about_me) || 'About information has not been added yet.'}
            </Text>
          </View>

          <DetailCard
            title="Personal Details"
            icon="user"
            items={[
              { label: 'Age', value: age !== null ? `${age} years` : '' },
              { label: 'Height', value: member.height },
              { label: 'Marital Status', value: member.marital_status },
              { label: 'Mother Tongue', value: member.mother_tongue },
            ]}
          />

          <DetailCard
            title="Religion & Community"
            icon="sparkles"
            items={[
              { label: 'Religion', value: member.religion },
              { label: 'Caste', value: member.cast },
              { label: 'Sub Caste', value: member.sub_cast },
              { label: 'Gotra', value: member.gotra },
            ]}
          />

          <DetailCard
            title="Education & Career"
            icon="education"
            description={member.about_my_career || member.about_my_education}
            items={[
              { label: 'Education', value: member.education },
              { label: 'Other Qualifications', value: member.any_other_qualifications },
              { label: 'Occupation', value: member.occupation },
              { label: 'Designation', value: member.designation },
              { label: 'Employed In', value: member.employed_in },
              { label: 'Organization', value: member.organization_name },
              { label: 'Job Location', value: member.job_location },
            ]}
          />

          <DetailCard
            title="Location"
            icon="location"
            items={[
              { label: 'City', value: member.city_living_in },
              { label: 'State', value: member.state_living_in },
              { label: 'Country', value: member.country_living_in },
              { label: 'Native Place', value: member.native_place },
            ]}
          />

          <DetailCard
            title="Family Details"
            icon="family"
            description={member.about_family}
            items={[
              { label: 'Family Type', value: member.family_type },
              { label: 'Family Status', value: member.family_status },
              { label: 'Father Occupation', value: member.father_occupation },
              { label: 'Mother Occupation', value: member.mother_occupation },
              { label: 'Brothers', value: member.no_of_brothers },
              { label: 'Sisters', value: member.no_of_sisters },
            ]}
          />

          <DetailCard
            title="Lifestyle"
            icon="leaf"
            showWhenEmpty
            description={member.about_lifestyle || member.lifestyle_about}
            items={[
              { label: 'Diet', value: member.diet ?? member.dietary_habits ?? member.eating_habits },
              { label: 'Smoking', value: member.is_smoking ?? member.smoking },
              { label: 'Drinking', value: member.is_drinking ?? member.drinking },
              { label: 'Hobbies', value: member.hobbies },
              { label: 'Interests', value: member.interests },
            ]}
          />

          <DetailCard
            title="Partner Preferences"
            icon="heart"
            showWhenEmpty
            description={member.about_my_partner ?? member.partner_preference ?? member.partner_preferences_about}
            items={[
              { label: 'Age From', value: member.partner_age_from ?? member.partner_age_min },
              { label: 'Age To', value: member.partner_age_to ?? member.partner_age_max },
              { label: 'Preferred Height', value: member.partner_height },
              { label: 'Preferred Marital Status', value: member.partner_marital_status },
              { label: 'Preferred Religion', value: member.partner_religion },
              { label: 'Preferred Caste', value: member.partner_cast ?? member.partner_caste },
              { label: 'Preferred Country', value: member.partner_country },
              { label: 'Preferred State', value: member.partner_state },
              { label: 'Preferred Education', value: member.partner_education },
              { label: 'Preferred Occupation', value: member.partner_occupation },
              { label: 'Preferred Diet', value: member.partner_diet },
            ]}
          />

          <DetailCard
            title="Astro & Kundli Details"
            icon="sparkles"
            showWhenEmpty
            showMissingValues
            items={[
              {
                label: 'Date of Birth',
                value: member.date_of_birth ?? member.dob ??
                  (member.birth_date_time ? String(member.birth_date_time).split(/[ T]/)[0] : null),
              },
              {
                label: 'Time of Birth',
                value: member.time_of_birth ?? member.birth_time ?? member.dob_time,
              },
              {
                label: 'Place of Birth',
                value: member.place_of_birth ?? member.birth_place ?? member.birth_city,
              },
              {
                label: 'Manglik',
                value: member.manglik ?? member.is_manglik,
              },
            ]}
          />

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionIcon}><AppIcon name="lock" style={styles.sectionIconText} /></View>
              <Text style={styles.sectionTitle}>Contact Details</Text>
            </View>
            <Text style={styles.contactNote}>
              Contact details are private. Unlock access to view this member's contact information.
            </Text>
            <View style={styles.lockedRow}>
              <Text style={styles.lockedLabel}>Phone Number</Text>
              <Text style={styles.lockedValue}>••••••••••</Text>
            </View>
            <View style={styles.lockedRow}>
              <Text style={styles.lockedLabel}>Email Address</Text>
              <Text style={styles.lockedValue}>••••••@••••</Text>
            </View>
            <TouchableOpacity
              style={styles.unlockButton}
              activeOpacity={0.85}
              onPress={handleUnlockContact}>
              <Text style={styles.unlockButtonText}>Unlock Contact Details</Text>
            </TouchableOpacity>
            <Text style={styles.unlockHint}>
              Unlocking requires server-side authorization; details are not shown yet.
            </Text>
          </View>

          {interestError ? <View style={styles.errorBox}><Text style={styles.errorText}>{interestError}</Text><TouchableOpacity onPress={retryInterest} disabled={interestLoading}><Text style={styles.retry}>Retry Interest Status</Text></TouchableOpacity></View> : null}
          {shortlistError ? <View style={styles.errorBox}><Text style={styles.errorText}>{shortlistError}</Text><TouchableOpacity onPress={retryShortlist} disabled={shortlistLoading}><Text style={styles.retry}>Retry Shortlist Status</Text></TouchableOpacity></View> : null}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.primaryAction, (interest?.sent && !canCancel) && styles.completedAction, interestDisabled && styles.disabledAction]}
          disabled={interestDisabled}
          onPress={canCancel ? handleCancelInterest : handleSendInterest}
          activeOpacity={0.85}>
          {interestLoading || interestSaving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <View style={styles.actionContents}>
              <AppIcon name={canCancel ? "close" : interest?.sent ? "check" : "send"} size={19} color={colors.white} />
              <Text style={styles.primaryActionText}>
                {!canSendInterest && !interest?.sent
                  ? 'Activate Profile'
                  : interestLabel(interest)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryAction, shortlisted && styles.selectedAction, shortlistDisabled && styles.disabledAction]}
          disabled={shortlistDisabled}
          onPress={toggleShortlist}
          activeOpacity={0.85}>
          {shortlistLoading || shortlistSaving ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={styles.actionContents}>
              <AppIcon name={shortlisted ? "saved" : "bookmark"} size={20} />
              <Text style={styles.secondaryActionText}>{shortlisted ? 'Shortlisted' : 'Shortlist'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  muted: { color: colors.textSecondary, marginTop: 12 },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 19 },
  hero: { height: 325, backgroundColor: colors.primaryLight, position: 'relative' },
  heroPhoto: { width: '100%', height: '100%' },
  noPhoto: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noPhotoIcon: { fontSize: 60 },
  noPhotoText: { color: colors.textSecondary, marginTop: 6 },
  photoTopRow: { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verifyBadge: { backgroundColor: '#188461', borderRadius: 18, paddingVertical: 7, paddingHorizontal: 10 },
  verifyText: { color: colors.white, fontWeight: '800', fontSize: 11 },
  idBadge: { backgroundColor: 'rgba(17,25,54,0.72)', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 7 },
  idText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  likeButton: { position: 'absolute', right: 16, bottom: 18, width: 46, height: 46, borderRadius: 23, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  likeButtonActive: { backgroundColor: colors.primaryLight },
  likeIcon: { fontSize: 31, color: colors.primary, lineHeight: 37 },
  likeIconActive: { color: colors.primary },
  body: { paddingHorizontal: 14 },
  summaryCard: { backgroundColor: colors.white, borderRadius: 20, padding: 17, marginTop: -20, borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
  memberName: { fontSize: 23, fontWeight: '800', color: colors.text },
  location: { fontSize: 12, color: colors.textSecondary, marginTop: 7, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 17 },
  statPill: { flex: 1, minWidth: 0, backgroundColor: colors.primaryLight, borderRadius: 11, paddingHorizontal: 6, paddingVertical: 11, alignItems: 'center' },
  statIcon: { fontSize: 17, marginBottom: 5 },
  statValue: { fontSize: 11, textAlign: 'center', fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 10, marginTop: 4, color: colors.textSecondary },
  sectionCard: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 13 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 11 },
  sectionIcon: { width: 31, height: 31, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sectionIconText: { fontSize: 16, color: colors.primary },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, flex: 1 },
  sectionDescription: { fontSize: 13, lineHeight: 21, color: colors.textSecondary, marginBottom: 10 },
  about: { fontSize: 13, lineHeight: 22, color: colors.textSecondary },
  contactNote: { fontSize: 12, lineHeight: 19, color: colors.textSecondary, marginBottom: 12 },
  lockedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderTopWidth: 1, borderTopColor: colors.primaryLight },
  lockedLabel: { fontSize: 12, color: colors.textSecondary },
  lockedValue: { fontSize: 13, letterSpacing: 1, color: colors.textSecondary, fontWeight: '700' },
  unlockButton: { marginTop: 14, minHeight: 48, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  unlockButtonText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  unlockHint: { fontSize: 11, lineHeight: 17, color: colors.textSecondary, textAlign: 'center', marginTop: 9 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.primaryLight },
  detailLabel: { flex: 1, fontSize: 12, color: colors.textSecondary, paddingRight: 10 },
  detailValue: { flex: 1.25, textAlign: 'right', fontSize: 12, color: colors.text, fontWeight: '600' },
  errorBox: { backgroundColor: '#FFF0F0', borderRadius: 12, padding: 13, marginBottom: 12 },
  retry: { fontSize: 12, marginTop: 9, fontWeight: '800', color: colors.primary },
  bottomBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  primaryAction: { flex: 1.25, minHeight: 48, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  actionContents: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  interestIcon: { fontSize: 19, color: colors.white, fontWeight: '700' },
  shortlistIcon: { fontSize: 22, color: colors.primary, fontWeight: '700' },
  primaryActionText: { fontSize: 12, color: colors.white, fontWeight: '800', textAlign: 'center' },
  secondaryAction: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.white, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  secondaryActionText: { fontSize: 12, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  selectedAction: { backgroundColor: colors.primaryLight },
  completedAction: { backgroundColor: '#188461' },
  disabledAction: { opacity: 0.55 },
});
