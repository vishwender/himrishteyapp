import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';
import {reportProfile} from '../api/reportProfileApi';
import colors from '../theme/colors';
import AppIcon from './AppIcon';

const reasons = ['Child safety or exploitation', 'Suspected underage member', 'Fake or misleading profile', 'Inappropriate content', 'Harassment or abusive behaviour', 'Spam or scam', 'Other'];

export default function ReportProfileModal({profileId, onClose}) {
  const {user} = useAuth();
  const member = user?.data?.member || user?.member || user;
  const [name, setName] = useState(member?.full_name || '');
  const [email, setEmail] = useState(member?.email || '');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const lock = useRef(false);
  const alive = useRef(true);
  const controller = useRef(null);
  useEffect(() => {
    alive.current = true;
    return () => {alive.current = false; controller.current?.abort();};
  }, []);

  const submit = async () => {
    if (lock.current) return;
    if (!profileId || !name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !reason || !details.trim()) {
      setError('Enter your name, a valid email, a reason and details.'); return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    controller.current = new AbortController();
    try {
      await reportProfile({name, email, reporterProfileId: member?.profile_id, profileId, reason, details}, controller.current.signal);
      if (alive.current) setSuccess(true);
    } catch (err) {
      if (alive.current) setError(err?.response?.data?.message || 'Submission could not be confirmed. It may have reached support; check before submitting again.');
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {if (!lock.current) onClose();}}>
    <SafeAreaView style={styles.root}>

      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.panel} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>{success ? 'Report received' : 'Report Profile'}</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close report" accessibilityState={{disabled: busy}} disabled={busy} style={styles.close} onPress={onClose}>
              <AppIcon name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {success ? <>
              <Text style={styles.body}>Your concern about {profileId} has been sent to support.</Text>
              <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={onClose}><Text style={styles.buttonText}>Done</Text></TouchableOpacity>
            </> : <>
              <Text style={styles.body}>Reporting profile {profileId}. Tell support what happened. Please avoid including passwords, payment details or identity documents.</Text>
              <Text style={styles.label}>Your name</Text>
              <TextInput accessibilityLabel="Your name" value={name} onChangeText={setName} maxLength={255} editable={!busy} style={styles.input} />
              <Text style={styles.label}>Your email</Text>
              <TextInput accessibilityLabel="Your email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" maxLength={255} editable={!busy} style={styles.input} />
              <Text style={styles.label}>Reason</Text>
              {reasons.map(item => <TouchableOpacity key={item} accessibilityRole="radio" accessibilityState={{checked: reason === item}} disabled={busy} style={[styles.reason, reason === item && styles.selected]} onPress={() => setReason(item)}><Text style={styles.reasonText}>{item}</Text></TouchableOpacity>)}
              <Text style={styles.label}>Details</Text>
              <TextInput accessibilityLabel="Report details" value={details} onChangeText={setDetails} maxLength={4000} multiline textAlignVertical="top" editable={!busy} style={[styles.input, styles.details]} />
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              <TouchableOpacity accessibilityRole="button" disabled={busy || !profileId} style={styles.button} onPress={submit}>{busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Submit Report</Text>}</TouchableOpacity>
            </>}
          </View>
        </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: 'rgba(17, 25, 54, 0.55)'},
  overlay: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16},
  panel: {width: '100%', maxWidth: 560, maxHeight: '92%', backgroundColor: colors.white, borderRadius: 20, overflow: 'hidden'},
  header: {flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border},
  close: {minWidth: 48, minHeight: 56, alignItems: 'center', justifyContent: 'center'},
  scroll: {flexGrow: 0},
  content: {padding: 20},
  card: {backgroundColor: colors.white},
  title: {flex: 1, fontSize: 22, fontWeight: '800', color: colors.title},
  body: {fontSize: 15, lineHeight: 23, color: colors.textSecondary, marginTop: 12},
  label: {fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 20, marginBottom: 8},
  input: {borderWidth: 1, borderColor: colors.border, borderRadius: 10, minHeight: 48, padding: 12, fontSize: 16, color: colors.text},
  details: {minHeight: 120},
  reason: {minHeight: 48, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10, marginBottom: 8},
  selected: {backgroundColor: colors.primaryLight, borderColor: colors.primary},
  reasonText: {fontSize: 15, color: colors.text},
  error: {fontSize: 15, lineHeight: 23, color: colors.error, marginTop: 12},
  button: {minHeight: 50, backgroundColor: colors.primary, padding: 14, borderRadius: 12, marginTop: 20, alignItems: 'center', justifyContent: 'center'},
  buttonText: {fontSize: 16, fontWeight: '700', color: colors.white},
});
