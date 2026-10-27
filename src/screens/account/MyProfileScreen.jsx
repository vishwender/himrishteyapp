import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getSessionMember } from '../../services/sessionMember';
import { getProfileImage } from '../../config/images';
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
    ],
  },
];

function display(value) {
  if (value == null || typeof value === 'object') {
    return '';
  }
  return String(value).trim();
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
  const location = [member.city_living_in, member.state_living_in]
    .map(display)
    .filter(Boolean)
    .join(', ');

  return (
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
        <View style={styles.photoBox}>
          {photo && failedPhoto !== photo ? (
            <Image
              source={{ uri: photo }}
              style={styles.photo}
              resizeMode="cover"
              onError={() => setFailedPhoto(photo)}
            />
          ) : (
            <AppIcon name="user" size={56} />
          )}
        </View>
        <Text style={styles.name}>
          {display(member.full_name) || 'My Profile'}
        </Text>
        {member.profile_id ? (
          <Text style={styles.profileId}>{display(member.profile_id)}</Text>
        ) : null}
        {location ? <Text style={styles.location}>{location}</Text> : null}
        <View style={styles.completionHeading}>
          <Text style={styles.completionText}>Profile completion</Text>
          <Text style={styles.completionValue}>{completion}%</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.progress, { width: `${completion}%` }]} />
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('EditProfile')}
          accessibilityRole="button"
        >
          <AppIcon name="edit" size={18} color={colors.white} />
          <Text style={styles.primaryText}>Edit My Profile</Text>
        </TouchableOpacity>
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
              .map(([label, key]) => ({ label, value: display(member[key]) }))
              .filter(row => row.value);
            const description = display(member[section.description]);
            return (
              <View key={section.title} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <AppIcon name={section.icon} size={20} />
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  hero: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoBox: {
    width: 112,
    height: 130,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  photo: { width: '100%', height: '100%' },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  profileId: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 6,
  },
  location: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
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
  primaryButton: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 13,
    backgroundColor: colors.primary,
    padding: 12,
    marginTop: 20,
  },
  primaryText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  section: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 8,
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
