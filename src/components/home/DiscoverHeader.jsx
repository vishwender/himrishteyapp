import React, { useId, useState } from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';
import { Bell } from 'lucide-react-native';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../AppIcon';
import { getProfileImage } from '../../config/images';
import { useAuth } from '../../context/AuthContext';
import colors from '../../theme/colors';

export default function DiscoverHeader({ navigation }) {
  const { user, signOut } = useAuth();
  const gradientId = `header-${useId().replace(/:/g, '')}`;
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(80);
  const [failedPhoto, setFailedPhoto] = useState(null);
  const photo = getProfileImage(user?.photo);

  const navigate = route => {
    setMenuOpen(false);
    if (route === 'Account') {
      navigation.navigate(route);
    } else {
      navigation.getParent()?.navigate(route);
    }
  };
  const logout = () => {
    setMenuOpen(false);
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch {
            Alert.alert('Unable to logout', 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View
      onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)}
      collapsable={false}
      style={styles.header}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" accessible={false}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#7149EB" />
              <Stop offset="1" stopColor="#4F28C1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
          <Polygon
            points="150,0 280,0 400,130 280,130"
            fill="rgba(255,255,255,0.025)"
          />
        </Svg>
      </View>
      <View style={styles.brandGroup}>
        <Text style={styles.brand}>HimRishtey</Text>
        <Text style={styles.tagline}>Find Your Perfect Match</Text>
      </View>
      <TouchableOpacity
        onPress={() => navigation.navigate('Search')}
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel="Search profiles"
      >
        <AppIcon name="search" size={25} color={colors.white} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() =>
          Alert.alert('Notifications', 'Notifications are not available yet.')
        }
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <Bell size={24} color={colors.white} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setMenuOpen(true)}
        style={styles.profileButton}
        accessibilityRole="button"
        accessibilityLabel="Open profile menu"
        accessibilityState={{ expanded: menuOpen }}
      >
        <View style={styles.avatar}>
          {photo && failedPhoto !== photo ? (
            <Image
              source={{ uri: photo }}
              style={styles.photo}
              onError={() => setFailedPhoto(photo)}
            />
          ) : (
            <AppIcon name="user" size={24} color={colors.white} />
          )}
        </View>
        <AppIcon name="expand" size={18} color={colors.white} />
      </TouchableOpacity>
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.modal}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setMenuOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close profile menu"
          />
          <View
            style={[styles.menu, { marginTop: insets.top + headerHeight - 4 }]}
            accessibilityViewIsModal
          >
            <View style={styles.identity}>
              <View style={styles.menuAvatar}>
                {photo && failedPhoto !== photo ? (
                  <Image source={{ uri: photo }} style={styles.photo} />
                ) : (
                  <AppIcon name="user" size={23} />
                )}
              </View>
              <View style={styles.identityText}>
                <Text style={styles.name}>
                  {user?.full_name || 'My Account'}
                </Text>
                {user?.profile_id ? (
                  <Text style={styles.profileId}>{user.profile_id}</Text>
                ) : null}
              </View>
            </View>
            {[
              { title: 'My Profile', icon: 'user', route: 'MyProfile' },
              { title: 'Membership', icon: 'crown', route: 'Membership' },
              {
                title: 'Settings',
                icon: 'settings',
                route: 'Account',
              },
            ].map(item => (
              <TouchableOpacity
                key={item.route}
                style={styles.menuItem}
                onPress={() => navigate(item.route)}
                accessibilityRole="button"
              >
                <AppIcon name={item.icon} size={21} />
                <Text style={styles.menuText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.menuItem, styles.logout]}
              onPress={logout}
              accessibilityRole="button"
            >
              <AppIcon name="logout" size={21} color={colors.error} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  brandGroup: { flex: 1 },
  brand: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: colors.white,
  },
  tagline: { fontSize: 10, lineHeight: 18, color: '#E6DDFF', marginTop: 3 },
  iconButton: {
    width: 44,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    minHeight: 48,
    padding: 4,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%' },
  modal: {
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  menu: {
    width: 280,
    maxWidth: '100%',
    borderRadius: 20,
    backgroundColor: colors.white,
    padding: 12,
    elevation: 10,
    shadowColor: colors.text,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 5 },
  },
  menuAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: { flex: 1 },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 6,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  profileId: { fontSize: 12, color: colors.textSecondary, marginTop: 5 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 50,
    padding: 10,
  },
  menuText: { flex: 1, fontSize: 14, color: colors.text },
  logout: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 5 },
  logoutText: { fontSize: 14, color: colors.error },
});
