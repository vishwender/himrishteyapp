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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getSessionMember } from '../../services/sessionMember';
import { getProfileImage } from '../../config/images';
import ProfilePhoto from '../../components/ProfilePhoto';
import AppIcon from '../../components/AppIcon';
import colors from '../../theme/colors';

const SECTIONS = [
  {
    title: 'About Me',
    icon: 'user',
    route: 'EditLifestyle',
    description: 'about_me',
    fields: [],
  },
  {
    title: 'Personal Details',
    icon: 'calendar',
    route: 'EditPersonal',
    fields: [
      ['Age', 'age_label'],
      ['Height', 'height'],
      ['Marital Status', 'marital_status'],
      ['Mother Tongue', 'mother_tongue'],
    ],
  },
  {
    title: 'Religion & Community',
    icon: 'sparkles',
    route: 'EditReligion',
    fields: [
      ['Religion', 'religion'],
      ['Caste', 'cast'],
      ['Sub Caste', 'sub_cast'],
      ['Gotra', 'gotra'],
    ],
  },
  {
    title: 'Education & Career',
    icon: 'education',
    route: 'EditEducationCareer',
    fields: [
      ['Education', 'education'],
      ['Other Qualifications', 'any_other_qualifications'],
      ['Employed In', 'employed_in'],
      ['Annual Income', 'annual_income'],
      ['Occupation', 'occupation'],
      ['Designation', 'designation'],
      ['Organization', 'organization_name'],
      ['Job Location', 'job_location'],
    ],
  },
  {
    title: 'Location',
    icon: 'location',
    route: 'EditLocation',
    fields: [
      ['City', 'city_living_in'],
      ['State', 'state_living_in'],
      ['Country', 'country_living_in'],
      ['Native Place', 'native_place'],
    ],
  },
  {
    title: 'Family Details',
    icon: 'family',
    route: 'EditFamily',
    description: 'about_family',
    fields: [
      ['Family Type', 'family_type'],
      ['Family Status', 'family_status'],
      ['Father’s Occupation', 'father_occupation'],
      ['Mother’s Occupation', 'mother_occupation'],
      ['Brothers', 'no_of_brothers'],
      ['Sisters', 'no_of_sisters'],
    ],
  },
  {
    title: 'Lifestyle',
    icon: 'leaf',
    route: 'EditLifestyle',
    fields: [
      ['Diet', 'diet'],
      ['Smoking', 'is_smoking'],
      ['Drinking', 'is_drinking'],
      ['Hobbies', 'hobbies'],
    ],
  },
  {
    title: 'Partner Preferences',
    icon: 'heart',
    route: 'EditPartnerPreferences',
    description: 'about_my_partner',
    fields: [
      ['Minimum Age', 'partner_age_from'],
      ['Maximum Age', 'partner_age_to'],
      ['Religion', 'partner_religion'],
      ['Education', 'partner_education'],
      ['Caste', 'partner_cast'],
      ['Country', 'partner_country'],
      ['State', 'partner_state'],
      ['Occupation', 'partner_occupation'],
      ['Diet', 'partner_diet'],
    ],
  },
  {
    title: 'Astro & Kundli Details',
    icon: 'sparkles',
    route: 'EditPersonal',
    fields: [
      ['Date of Birth', 'birth_date'],
      ['Time of Birth', 'birth_time_label'],
      ['Place of Birth', 'birth_place'],
      ['Manglik', 'manglik'],
      ['Horoscope Needed', 'horoscope_needed'],
    ],
  },
  {
    title: 'Contact Details',
    icon: 'lock',
    route: 'EditBasic',
    fields: [
      ['Phone Number', 'mobile_number'],
      ['Email Address', 'email'],
      ['Alternate Number', 'alternate_number'],
      ['WhatsApp Number', 'whatsapp_number'],
    ],
  },
];

function display(value) {
  if (value == null || typeof value === 'object') {
    return '';
  }
  return String(value).trim();
}

function getAge(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(display(value));
  if (!match) return null;
  const year = Number(match[1]),
    month = Number(match[2]) - 1,
    day = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  )
    return null;
  const today = new Date();
  let age = today.getFullYear() - year;
  if (
    today.getMonth() < month ||
    (today.getMonth() === month && today.getDate() < day)
  )
    age--;
  return age >= 18 && age <= 120 ? age : null;
}

function formatHeight(value) {
  const text = display(value);
  const match = /^(\d+)(?:\.(\d+))?$/.exec(text);
  return match ? `${match[1]} ft ${Number(match[2] || 0)} in` : text;
}

function SummaryDetail({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.statPill}>
      <AppIcon name={icon} size={18} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function MyProfileScreen({ navigation }) {
  const { user, refreshUser } = useAuth();
  const member = getSessionMember(user);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [failedPhoto, setFailedPhoto] = useState(null);
  const active = useRef(false);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;
    setRefreshing(true);
    setError('');
    setFailedPhoto(null);
    try {
      await refreshUser();
    } catch (err) {
      if (active.current) {
        setError(
          err?.response?.data?.message ||
            'Unable to refresh your profile. Please try again.',
        );
      }
    } finally {
      inFlight.current = false;
      if (active.current) {
        setRefreshing(false);
      }
    }
  }, [refreshUser]);

  useFocusEffect(
    useCallback(() => {
      active.current = true;
      refresh();
      return () => {
        active.current = false;
      };
    }, [refresh]),
  );

  const photo = getProfileImage(member.photo);
  const completion = Math.max(
    0,
    Math.min(100, Number(member.profile_completed) || 0),
  );
  const age = getAge(member.birth_date_time);
  const details = {
    ...member,
    height: formatHeight(member.height),
    age_label: age === null ? '' : `${age} years`,
    birth_date: display(member.birth_date_time).split(/[ T]/)[0],
    birth_time_label:
      display(member.birth_time) ||
      display(member.birth_date_time).split(/ (.+)/)[1] ||
      '',
  };
  const location = [
    member.city_living_in,
    member.state_living_in,
    member.country_living_in,
  ]
    .map(display)
    .filter(Boolean)
    .join(', ');

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.hero}>
          {photo && failedPhoto !== photo ? (
            <ProfilePhoto
              uri={photo}
              style={styles.photo}
              accessibilityLabel="Your profile photo"
              onError={() => setFailedPhoto(photo)}
            />
          ) : (
            <View style={styles.noPhoto}>
              <AppIcon name="user" size={60} />
              <Text style={styles.empty}>Photo not available</Text>
            </View>
          )}
          {member.profile_id ? (
            <View style={styles.idBadge} pointerEvents="none">
              <Text style={styles.idText}>{display(member.profile_id)}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            style={styles.photoAction}
            onPress={() => navigation.navigate('MyPhotos')}
          >
            <AppIcon name="camera" size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.body}>
          <View style={styles.summaryCard}>
            <Text style={styles.name}>
              {display(member.full_name) || 'My Profile'}
              {age === null ? '' : `, ${age}`}
            </Text>
            <Text style={styles.location}>
              {location || 'Location not specified'}
            </Text>
            <View style={styles.statsRow}>
              <SummaryDetail
                icon="height"
                label="Height"
                value={details.height}
              />
              <SummaryDetail
                icon="education"
                label="Education"
                value={display(member.education)}
              />
              <SummaryDetail
                icon="work"
                label="Profession"
                value={display(member.occupation)}
              />
            </View>
            <View style={styles.completionHeading}>
              <Text style={styles.completionText}>Profile completion</Text>
              <Text style={styles.completionValue}>{completion}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.progress, { width: `${completion}%` }]} />
            </View>
          </View>
          {error ? (
            <View style={styles.error} accessibilityLiveRegion="polite">
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                onPress={refresh}
                accessibilityRole="button"
                style={styles.retry}
              >
                <Text style={styles.link}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {!member.id && refreshing ? (
            <ActivityIndicator
              color={colors.primary}
              accessibilityLabel="Loading your profile"
            />
          ) : null}
          {!member.id && !refreshing && !error ? (
            <Text style={styles.empty}>
              Your profile is not available yet. Pull down to retry.
            </Text>
          ) : null}
          {member.id
            ? SECTIONS.map(section => {
                const rows = section.fields
                  .map(([label, key]) => ({
                    label,
                    value: display(details[key]),
                  }))
                  .filter(row => row.value);
                const description = display(member[section.description]);
                return (
                  <View key={section.title} style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionIcon}>
                        <AppIcon name={section.icon} size={18} />
                      </View>
                      <Text style={styles.sectionTitle}>{section.title}</Text>
                      <TouchableOpacity
                        onPress={() => navigation.navigate(section.route)}
                        style={styles.editButton}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${section.title}`}
                      >
                        <AppIcon name="edit" size={18} />
                      </TouchableOpacity>
                    </View>
                    {description ? (
                      <Text style={styles.description}>{description}</Text>
                    ) : null}
                    {rows.map(row => (
                      <View key={row.label} style={styles.row}>
                        <Text style={styles.label}>{row.label}</Text>
                        <Text style={styles.value}>{row.value}</Text>
                      </View>
                    ))}
                    {!description && rows.length === 0 ? (
                      <Text style={styles.empty}>
                        Not added yet. Tap edit to complete this section.
                      </Text>
                    ) : null}
                  </View>
                );
              })
            : null}
        </View>
      </ScrollView>
      {member.id ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryButton}
            accessibilityRole="button"
            onPress={() => navigation.navigate('EditProfile')}
          >
            <AppIcon name="edit" size={18} color={colors.white} />
            <Text style={styles.primaryText}>Edit My Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            accessibilityRole="button"
            onPress={() => navigation.navigate('MyPhotos')}
          >
            <AppIcon name="camera" size={18} />
            <Text style={styles.secondaryText}>Manage Photos</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 24 },
  hero: {
    height: 325,
    backgroundColor: colors.primaryLight,
    position: 'relative',
  },
  photo: { width: '100%', height: '100%' },
  noPhoto: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  idBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(17,25,54,0.72)',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  idText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  photoAction: {
    position: 'absolute',
    right: 16,
    bottom: 28,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  body: { paddingHorizontal: 14 },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 17,
    marginTop: -20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  name: { fontSize: 23, fontWeight: '800', color: colors.text },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 7,
    lineHeight: 18,
  },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 17 },
  statPill: {
    flex: 1,
    minWidth: 80,
    backgroundColor: colors.primaryLight,
    borderRadius: 11,
    paddingHorizontal: 6,
    paddingVertical: 11,
    alignItems: 'center',
    gap: 5,
  },
  statValue: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: { fontSize: 10, color: colors.textSecondary },
  completionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    gap: 10,
    marginTop: 24,
    marginBottom: 10,
  },
  completionText: { flex: 1, fontSize: 13, color: colors.textSecondary },
  completionValue: { fontSize: 13, fontWeight: '700', color: colors.primary },
  track: {
    height: 7,
    alignSelf: 'stretch',
    backgroundColor: colors.primaryLight,
    borderRadius: 7,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 7,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primaryButton: {
    flex: 1.25,
    flexDirection: 'row',
    gap: 6,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary,
    padding: 10,
  },
  primaryText: {
    flexShrink: 1,
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 10,
  },
  secondaryText: {
    flexShrink: 1,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 8,
  },
  sectionIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  editButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: colors.primaryLight,
  },
  label: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  value: {
    flex: 1.3,
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  description: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
  },
  empty: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  error: {
    padding: 16,
    backgroundColor: '#FFF0F0',
    borderRadius: 14,
    marginBottom: 14,
  },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 20 },
  retry: { minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' },
  link: { color: colors.primary, fontWeight: '700' },
});
