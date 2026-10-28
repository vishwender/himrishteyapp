import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import AppIcon from '../../components/AppIcon';

import React, {
  useCallback,
  useState,
} from 'react';

import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useAuth } from '../../context/AuthContext';
import { getProfileImage } from '../../config/images';
import colors from '../../theme/colors';

function AccountItem({ icon, title, subtitle, onPress, disabled = false }) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}>
      <View style={styles.menuIcon}>
        <AppIcon name={icon} size={22} />
      </View>

      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>
          {disabled ? 'Coming soon' : subtitle}
        </Text>
      </View>

      {!disabled ? (
        <AppIcon name="next" style={styles.chevron} />
      ) : null}
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const bottomBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();
  const { user, signOut, refreshUser } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  // Support the direct member object and the Laravel
  // API response structure.
  const member = user?.data?.member || user?.member || user;

  const completion = Math.max(
    0,
    Math.min(100, Number(member?.profile_completed) || 0),
  );

  const imageURL = member?.photo
    ? getProfileImage(member.photo)
    : null;

  const initials = String(member?.full_name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();

  const location = [
    member?.city_living_in,
    member?.state_living_in,
  ]
    .filter(Boolean)
    .join(', ');

  const refreshProfile = useCallback(async () => {
    setRefreshing(true);
    setError('');

    try {
      await refreshUser();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Unable to refresh your profile.',
      );
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser]);

  // Refresh whenever the Account tab becomes active.
  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile]),
  );

  const viewProfile = () => {
    navigation.getParent()?.navigate('MyProfile');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);

            try {
              await signOut();
            } catch (err) {
              setLoggingOut(false);

              Alert.alert(
                'Error',
                'Unable to logout. Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, {paddingBottom: bottomBarHeight + 35}]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshProfile}
          colors={[colors.primary]}
        />
      }>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>

        <Text style={styles.headerSubtitle}>
          Manage your matrimonial profile
        </Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarBox}>
            {imageURL ? (
              <Image
                source={{ uri: imageURL }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.initials}>
                {initials}
              </Text>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text
              style={styles.memberName}
              numberOfLines={2}>
              {member?.full_name || 'My Profile'}
            </Text>

            <Text style={styles.profileId}>
              {member?.profile_id || ''}
            </Text>

            {location ? (
              <Text
                style={styles.location}
                numberOfLines={2}>
                {location}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.completionHeader}>
          <Text style={styles.completionTitle}>
            Profile Completion
          </Text>

          <Text style={styles.completionValue}>
            {completion}%
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${completion}%` },
            ]}
          />
        </View>

        <TouchableOpacity
          style={styles.viewButton}
          onPress={viewProfile}>
          <Text style={styles.viewButtonText}>
            View My Profile
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <TouchableOpacity
          style={styles.errorBox}
          onPress={refreshProfile}>
          <Text style={styles.errorText}>
            {error} Tap to retry.
          </Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.sectionTitle}>My Profile</Text>

      <View style={styles.menuCard}>
        <AccountItem
          icon="user"
          title="View My Profile"
          subtitle="View your complete profile"
          onPress={viewProfile}
        />

        <View style={styles.divider} />

        <AccountItem
          icon="edit"
          title="Edit Profile"
          subtitle="Update your matrimonial profile"
          onPress={() =>
            navigation.getParent()?.navigate('EditProfile')
          }
        />

        <View style={styles.divider} />

        <AccountItem
          icon="camera"
          title="My Photos"
          subtitle="Take, choose and upload photos"
          onPress={() =>
            navigation.getParent()?.navigate('MyPhotos')
          }
        />

        <View style={styles.divider} />

        <AccountItem
          icon="lock"
          title="Change Password"
          subtitle="Update your account password"
          onPress={() =>
            navigation.getParent()?.navigate('ChangePassword')
          }
        />
      </View>


      <Text style={styles.sectionTitle}>Membership</Text>

      <View style={styles.menuCard}>
        <AccountItem
          icon="crown"
          title="Membership"
          subtitle="View membership plans"
          onPress={() =>
            navigation.getParent()?.navigate('Membership')
          }
        />

        <View style={styles.divider} />

        <AccountItem
          icon="wallet"
          title="My Wallet"
          subtitle="Wallet balance and transactions"
          onPress={() =>
            navigation.getParent()?.navigate('Wallet')
          }
        />
      </View>

      <Text style={styles.sectionTitle}>Account Settings</Text>

      <View style={styles.menuCard}>
        <AccountItem
          icon="settings"
          title="Settings & Privacy"
          disabled
        />

        <AccountItem
          icon="eye"
          title="Profile Visibility"
          subtitle="Show or hide your matrimonial profile"
          onPress={() =>
            navigation.getParent()?.navigate('ProfileVisibility')
          }
        />

        <AccountItem
          icon="delete"
          title="Delete Account"
          subtitle="Request account deletion"
          onPress={() =>
            navigation.getParent()?.navigate('DeleteAccount')
          }
        />

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.menuItem}
          disabled={loggingOut}
          onPress={handleLogout}>

          <View style={styles.menuIcon}>
            <AppIcon name="logout" style={styles.menuEmoji} />
          </View>

          <View style={styles.menuContent}>
            <Text style={styles.logoutText}>
              Logout
            </Text>
          </View>

          {loggingOut ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <AppIcon name="next" style={styles.chevron} />
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>
        HimShaadi
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FF',
  },
  content: {
    paddingBottom: 35,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 5,
  },
  profileCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEEAF7',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 86,
    height: 96,
    borderRadius: 14,
    backgroundColor: '#EDE8FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
    paddingLeft: 15,
  },
  memberName: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
  },
  profileId: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 5,
  },
  location: {
    marginTop: 7,
    fontSize: 12,
    color: colors.textSecondary,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
  },
  completionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  completionValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#EEEAF7',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  viewButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 12,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  menuCard: {
    marginHorizontal: 16,
    marginBottom: 19,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEAF7',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#F5F1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuEmoji: {
    fontSize: 19,
  },
  menuContent: {
    flex: 1,
    marginLeft: 13,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  menuSubtitle: {
    fontSize: 11,
    marginTop: 4,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 26,
    color: '#B4AFC0',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1EDF6',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B42318',
  },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    color: '#B42318',
    fontSize: 12,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 12,
  },
});
