import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, Share, StyleSheet, TouchableOpacity, View} from 'react-native';
import AppIcon from './AppIcon';
import {profileLikeRequest} from '../api/profileLikeApi';
import {useAuth} from '../context/AuthContext';
import colors from '../theme/colors';

export default function MemberProfileActions({member}) {
  const {user} = useAuth();
  const own = user?.data?.member || user?.member || user;
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [sharing, setSharing] = useState(false);
  const busy = useRef(false);
  const shareLock = useRef(false);
  const controller = useRef(null);
  const self = own?.id != null && String(own.id) === String(member?.id);

  useEffect(() => {
    const request = new AbortController();
    controller.current = request;
    setLiked(false);
    setFailed(false);
    setLoading(true);
    busy.current = false;
    if (!member?.id || self) {setLoading(false); return () => request.abort();}
    profileLikeRequest(member.id, 'get', request.signal).then(value => {
      if (!request.signal.aborted) setLiked(value);
    }).catch(() => {
      if (!request.signal.aborted) setFailed(true);
    }).finally(() => {
      if (!request.signal.aborted) setLoading(false);
    });
    return () => request.abort();
  }, [member?.id, self, attempt]);

  const toggle = async () => {
    if (busy.current || loading || self || !member?.id) return;
    if (failed) {setAttempt(value => value + 1); return;}
    busy.current = true;
    setLoading(true);
    const request = controller.current;
    try {
      const value = await profileLikeRequest(member.id, liked ? 'delete' : 'post', request.signal);
      if (!request.signal.aborted) setLiked(value);
    } catch (err) {
      if (!request.signal.aborted) {
        setFailed(true);
        Alert.alert('Like unavailable', err?.response?.data?.message || err.message || 'Please retry the like status.');
      }
    } finally {
      if (!request.signal.aborted) {busy.current = false; setLoading(false);}
    }
  };
  const share = async () => {
    if (shareLock.current) return;
    shareLock.current = true;
    setSharing(true);
    try {
      await Share.share({message: `View ${member.full_name || 'this member'} on HimShaadi. Profile ID: ${member.profile_id}. Search this ID in the app.`});
    } catch {
      if (!controller.current?.signal.aborted) Alert.alert('Unable to share', 'Please try sharing this profile again.');
    } finally {
      shareLock.current = false;
      if (!controller.current?.signal.aborted) setSharing(false);
    }
  };
  return (
    <View style={styles.actions}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Share profile" disabled={sharing || !member?.profile_id} onPress={share} style={styles.button}>
        <AppIcon name="share" size={23} />
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={failed ? 'Retry like status' : liked ? 'Unlike profile' : 'Like profile'} accessibilityState={{disabled: loading || self || !member?.id, selected: liked}} disabled={loading || self || !member?.id} onPress={toggle} style={[styles.button, liked && styles.active]}>
        {loading ? <ActivityIndicator color={colors.primary} size="small" /> : <AppIcon name={failed ? 'recent' : 'heart'} size={24} filled={liked} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {position: 'absolute', right: 16, bottom: 36, flexDirection: 'row', gap: 10},
  button: {width: 48, height: 48, borderRadius: 24, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', elevation: 3},
  active: {backgroundColor: colors.primaryLight},
});
