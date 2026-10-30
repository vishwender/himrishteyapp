import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AppIcon from '../../components/AppIcon';
import {useAuth} from '../../context/AuthContext';
import {isVerifiedMember} from '../../services/memberVerification';
import {requestVerificationOtp, verifyProfileOtp} from '../../api/verificationApi';
import colors from '../../theme/colors';

export default function ProfileVerificationScreen() {
  const {user, refreshUser} = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const lock = useRef(false);
  const alive = useRef(true);
  const controller = useRef(null);
  const verified = confirmed || isVerifiedMember(user?.data?.member || user?.member || user);

  useEffect(() => {
    alive.current = true;
    return () => {alive.current = false; controller.current?.abort();};
  }, []);

  const run = async action => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    controller.current = new AbortController();
    try {
      await action(controller.current.signal);
    } catch (err) {
      if (alive.current) setError(err?.response?.data?.message || err.message || 'Unable to verify your profile. Please try again.');
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  };

  const request = () => run(async signal => {
    const result = await requestVerificationOtp(signal);
    if (!alive.current) return;
    if (result.alreadyVerified) {setConfirmed(true); return;}
    setChallenge({...result, expiresAt: Date.now() + result.expires_in * 1000});
    setOtp('');
  });
  const verify = () => {
    if (!/^\d{4}$/.test(otp)) {setError('Enter the four-digit OTP.'); return;}
    if (!challenge || Date.now() >= challenge.expiresAt) {
      setError('Your OTP has expired. Request a new OTP.'); return;
    }
    run(async signal => {
      await verifyProfileOtp(challenge.challenge_id, otp, signal);
      if (!alive.current) return;
      setConfirmed(true);
      setOtp('');
      setChallenge(null);
      await refreshUser();
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <AppIcon name="verified" size={40} />
            <Text accessibilityRole="header" style={styles.title}>{verified ? 'Profile verified' : 'Verify your profile'}</Text>
            <Text style={styles.body}>{verified
              ? 'Your account is marked as verified.'
              : 'Verify the mobile number registered with your account using a four-digit SMS code.'}</Text>
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            {verified ? (
              <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.secondary} onPress={() => run(() => refreshUser())}>
                <Text style={styles.link}>Refresh Status</Text>
              </TouchableOpacity>
            ) : challenge ? (
              <>
                <Text style={styles.body}>Code sent to {challenge.mobile_number || 'your registered mobile number'}. Valid for {Math.ceil(challenge.expires_in / 60)} minutes.</Text>
                <Text style={styles.label}>Verification code</Text>
                <TextInput accessibilityLabel="Verification code" style={styles.input} value={otp} onChangeText={value => setOtp(value.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="sms-otp" maxLength={4} editable={!busy} />
                <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.button} onPress={verify}>
                  <Text style={styles.buttonText}>Verify Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.secondary} onPress={request}>
                  <Text style={styles.link}>Request New OTP</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.button} onPress={request}>
                <Text style={styles.buttonText}>Send Verification OTP</Text>
              </TouchableOpacity>
            )}
            {busy ? <ActivityIndicator accessibilityLabel="Verification in progress" color={colors.primary} style={styles.spinner} /> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  content: {padding: 20},
  card: {backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 22},
  title: {fontSize: 24, fontWeight: '800', color: colors.title, marginTop: 18},
  body: {fontSize: 15, lineHeight: 24, color: colors.textSecondary, marginTop: 14},
  label: {fontSize: 15, color: colors.text, marginTop: 20, marginBottom: 8},
  input: {borderWidth: 1, borderColor: colors.border, borderRadius: 12, minHeight: 52, paddingHorizontal: 16, fontSize: 22, color: colors.text},
  button: {backgroundColor: colors.primary, borderRadius: 12, minHeight: 50, padding: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20},
  buttonText: {fontSize: 16, fontWeight: '700', color: colors.white},
  secondary: {minHeight: 48, padding: 14, justifyContent: 'center', alignItems: 'center'},
  link: {color: colors.primary, fontSize: 15, fontWeight: '600'},
  error: {fontSize: 15, lineHeight: 23, color: colors.error, marginTop: 16},
  spinner: {marginTop: 14},
});
