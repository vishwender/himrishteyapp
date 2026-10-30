import ProfileImage from '../ProfileImage';
import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react-native';
import {
  Alert,
  ScrollView,
  useWindowDimensions,
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
import { getWallet } from '../../api/membershipWalletApi';
import { getSessionMember } from '../../services/sessionMember';

export default function DiscoverHeader({ navigation }) {
  const { user, signOut, refreshUser } = useAuth();
  const member = getSessionMember(user);
  const { height } = useWindowDimensions();
  const [wallet, setWallet] = useState(null);
  const [walletAttempt, setWalletAttempt] = useState(0);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(false);
  const [refreshAttempt, setRefreshAttempt] = useState(0);
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(80);
  const photo = getProfileImage(member.photo);
  const activation = String(member.active ?? '')
    .trim()
    .toLowerCase();
  const status =
    activation === 'yes'
      ? 'Active'
      : activation === 'no'
      ? 'Inactive'
      : 'Status unavailable';
  const planName =
    typeof member.plan_name === 'string' ? member.plan_name.trim() : '';
  const noPlan =
    member.plan_id !== null &&
    member.plan_id !== undefined &&
    String(member.plan_id).trim() === '0';
  const planLabel =
    planName ||
    (noPlan
      ? 'No plan'
      : detailsLoading
      ? 'Loading plan…'
      : 'Plan unavailable');

  useEffect(() => {
    if (!menuOpen || typeof refreshUser !== 'function') return;
    let current = true;
    setDetailsLoading(true);
    setDetailsError(false);
    Promise.resolve()
      .then(() => refreshUser())
      .catch(() => {
        if (current) setDetailsError(true);
      })
      .finally(() => {
        if (current) setDetailsLoading(false);
      });
    return () => {
      current = false;
    };
  }, [menuOpen, refreshUser, refreshAttempt]);

  useEffect(() => {
    if (!menuOpen || member.id == null) return;
    const memberId = String(member.id);
    const controller = new AbortController();
    let current = true;
    setWallet({ memberId, loading: true });
    getWallet(controller.signal)
      .then(data => {
        const balance = data?.balance;
        if (
          String(data?.member_id) !== memberId ||
          balance == null ||
          balance === '' ||
          !Number.isFinite(Number(balance))
        )
          throw new Error('Invalid wallet response');
        if (current)
          setWallet({
            memberId,
            label: `${
              data.currency === 'INR' ? '₹' : data.currency || ''
            }${Number(balance).toFixed(2)}`,
          });
      })
      .catch(() => {
        if (current) setWallet({ memberId, error: true });
      });
    return () => {
      current = false;
      controller.abort();
    };
  }, [menuOpen, member.id, walletAttempt]);
  const currentWallet = wallet?.memberId === String(member.id) ? wallet : null;
  const walletLabel =
    currentWallet?.label || (currentWallet?.error ? 'Unavailable' : 'Loading…');

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
      <View style={styles.brandGroup}>
        <Text style={styles.brand}>HimShaadi</Text>
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
          <ProfileImage uri={photo} gender={member?.gender} style={styles.photo} />
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
            style={[
              styles.menu,
              {
                marginTop: insets.top + headerHeight - 4,
                maxHeight: Math.max(
                  160,
                  height - insets.top - headerHeight - insets.bottom - 12,
                ),
              },
            ]}
            accessibilityViewIsModal
          >
            <ScrollView style={styles.menuScroll} bounces={false}>
              <View style={styles.identity}>
                <View style={styles.menuAvatar}>
                  <ProfileImage uri={photo} gender={member?.gender} style={styles.photo} />
                </View>
                <View style={styles.identityText}>
                  <Text style={styles.name}>
                    {member.full_name || 'My Account'}
                  </Text>
                  {member.profile_id ? (
                    <Text style={styles.profileId}>{member.profile_id}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.planSummary} accessibilityLiveRegion="polite">
                <View style={styles.planRow}>
                  <AppIcon name="crown" size={20} />
                  <View style={styles.identityText}>
                    <Text style={styles.planCaption}>Membership plan</Text>
                    <Text style={styles.planName}>{planLabel}</Text>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <Text
                    style={[
                      styles.statusText,
                      activation === 'yes' && styles.activeStatus,
                    ]}
                  >
                    {status}
                  </Text>
                </View>
                {detailsError ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => setRefreshAttempt(value => value + 1)}
                    style={styles.retryDetails}
                  >
                    <Text style={styles.refreshError}>
                      Unable to refresh details. Retry
                    </Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={styles.walletRow}
                  accessibilityRole="button"
                  accessibilityLabel="Wallet balance"
                  accessibilityHint="Open your wallet"
                  onPress={() => navigate('Wallet')}
                >
                  <AppIcon name="wallet" size={20} />
                  <View style={styles.identityText}>
                    <Text style={styles.planCaption}>Wallet balance</Text>
                    <Text style={styles.planName}>{walletLabel}</Text>
                  </View>
                  <AppIcon name="next" size={18} />
                </TouchableOpacity>
                {currentWallet?.error ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={styles.retryDetails}
                    onPress={() => setWalletAttempt(value => value + 1)}
                  >
                    <Text style={styles.refreshError}>
                      Retry wallet balance
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {[
                { title: 'My Profile', icon: 'user', route: 'MyProfile' },
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
                  <AppIcon name="next" size={18} />
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
            </ScrollView>
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
  menuScroll: { flexShrink: 1 },
  planSummary: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 6,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planCaption: { fontSize: 11, color: colors.textSecondary },
  planName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  activeStatus: { color: colors.primary },
  retryDetails: { minHeight: 44, justifyContent: 'center' },
  refreshError: { fontSize: 12, color: colors.error },
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
