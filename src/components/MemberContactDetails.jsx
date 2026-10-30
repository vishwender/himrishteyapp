import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {getContactQuote, unlockContact} from '../api/contactUnlockApi';
import {useAuth} from '../context/AuthContext';
import colors from '../theme/colors';
import AppIcon from './AppIcon';

export default function MemberContactDetails(props) {
  const {user} = useAuth();
  const viewer = user?.data?.member || user?.member || user;
  return <ContactDetails key={`${viewer?.id}:${props.memberId}`} {...props} />;
}

function unlockErrorMessage(err) {
  const message = err?.response?.data?.message || err?.message || '';
  if (err?.response?.status >= 500 || /SQLSTATE|\bSQL:|Stack trace|Connection:|Database:/i.test(message)) {
    return 'Unable to unlock contact details right now. Please try again later. Retrying this profile will not charge twice.';
  }
  return message || 'Unlock could not be confirmed. Retry this profile to check without a duplicate charge.';
}

function ContactDetails({memberId, navigation}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const quoteController = useRef(null);
  const quoteRevision = useRef(0);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const locked = useRef(false);
  const alive = useRef(true);
  const controller = useRef(null);
  useEffect(() => {
    alive.current = true;
    return () => {alive.current = false; controller.current?.abort(); quoteController.current?.abort(); quoteRevision.current += 1;};
  }, []);

  const submit = async () => {
    if (!alive.current || locked.current || result || !quote || !quote.can_afford) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    controller.current = new AbortController();
    try {
      const response = await unlockContact(memberId, controller.current.signal, quote.price);
      if (alive.current) {setResult(response); setModalOpen(false);}
    } catch (err) {
      if (alive.current) {setQuote(null); setError({
        status: err?.response?.status,
        message: unlockErrorMessage(err),
        data: err?.response?.data?.data,
      });}
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const loadQuote = async () => {
    quoteController.current?.abort();
    const revision = ++quoteRevision.current;
    quoteController.current = new AbortController();
    setQuoting(true);
    setQuote(null);
    setError(null);
    try {
      const response = await getContactQuote(memberId, quoteController.current.signal);
      if (alive.current && revision === quoteRevision.current) setQuote(response);
    } catch (err) {
      if (alive.current && revision === quoteRevision.current) setError({status: err?.response?.status, message: unlockErrorMessage(err)});
    } finally {
      if (alive.current && revision === quoteRevision.current) setQuoting(false);
    }
  };
  const closeModal = () => {
    if (locked.current) return;
    quoteController.current?.abort();
    quoteRevision.current += 1;
    setQuoting(false);
    setQuote(null);
    setModalOpen(false);
  };
  const confirm = () => {
    if (locked.current || result) return;
    setModalOpen(true);
    loadQuote();
  };
  const open = screen => {
    const parent = navigation?.getParent?.();
    (parent || navigation)?.navigate?.(screen);
  };
  const fields = [
    ['Phone Number', 'mobile_number'], ['Email Address', 'email'],
    ['Alternate Number', 'alternate_number'], ['WhatsApp Number', 'whatsapp_number'],
  ];
  return (
    <View style={styles.card}>
      {modalOpen ? <Modal visible transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.overlay}>
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent} accessibilityViewIsModal>
            <Text style={styles.modalTitle} accessibilityRole="header">Unlock Profile</Text>
            {quote ? <>
              <Text style={styles.memberName}>{quote.profile.full_name || 'Member'}</Text>
              <View style={styles.priceRow}><Text style={styles.priceLabel}>Profile view price</Text><Text style={styles.priceValue}>{`${quote.price} coins`}</Text></View>
              <View style={styles.priceRow}><Text style={styles.priceLabel}>Wallet balance</Text><Text style={styles.priceValue}>{`${quote.wallet_balance} coins`}</Text></View>
              {quote.already_unlocked ? <Text style={styles.note}>Already unlocked. No additional charge.</Text> : <Text style={styles.note}>The server checks your balance and price again when you unlock.</Text>}
              {!quote.can_afford ? <><Text style={styles.error}>Insufficient wallet balance.</Text><TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => {closeModal(); open('Wallet');}}><Text style={styles.buttonText}>View Wallet</Text></TouchableOpacity></> : null}
            </> : null}
            {quoting ? <ActivityIndicator accessibilityLabel="Loading profile view price" color={colors.primary} /> : null}
            {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error.message}</Text> : null}
            {!quoting && !quote ? <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.button} onPress={loadQuote}><Text style={styles.buttonText}>Retry Price</Text></TouchableOpacity> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.cancel} onPress={closeModal}><Text style={styles.priceLabel}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" accessibilityState={{disabled: busy || quoting || !quote?.can_afford, busy}} disabled={busy || quoting || !quote?.can_afford} style={[styles.button, styles.confirm, (busy || quoting || !quote?.can_afford) && styles.disabled]} onPress={submit}>
                {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Unlock</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal> : null}
      <View style={styles.heading}><AppIcon name="lock" size={18} /><Text style={styles.title}>Contact Details</Text></View>
      {result ? <>
        {fields.map(([label, key]) => <View key={key} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <Text selectable style={styles.value}>{String(result.contact_details[key] || '').trim() || 'Not provided'}</Text>
        </View>)}
        <Text style={styles.note}>{result.already_unlocked ? 'Previously unlocked. No coins deducted.' : `Contact unlocked. ${result.coins_deducted} coins deducted.`} Wallet balance: {result.wallet_balance} coins.</Text>
      </> : <>
        <Text style={styles.note}>Contact details are private. Unlock access using your wallet.</Text>
        <View style={styles.row}><Text style={styles.label}>Phone Number</Text><Text style={styles.value}>••••••••••</Text></View>
        <View style={styles.row}><Text style={styles.label}>Email Address</Text><Text style={styles.value}>••••••@••••</Text></View>
        {error ? <View accessibilityLiveRegion="polite">
          <Text style={styles.error}>{error.message}</Text>
          {error.status === 402 && Number.isFinite(error.data?.required_coins) && Number.isFinite(error.data?.wallet_balance) ? <Text style={styles.note}>Required: {error.data.required_coins} coins. Wallet balance: {error.data.wallet_balance} coins.</Text> : null}
          {error.status === 402 || error.status === 403 ? <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => open(error.status === 402 ? 'Wallet' : 'Membership')}><Text style={styles.buttonText}>{error.status === 402 ? 'View Wallet' : 'View Membership Plans'}</Text></TouchableOpacity> : null}
        </View> : null}
        <TouchableOpacity accessibilityRole="button" accessibilityState={{disabled: busy || !memberId, busy}} disabled={busy || !memberId} style={styles.button} onPress={confirm}>
          {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>{error ? 'Retry Unlock' : 'Unlock Contact Details'}</Text>}
        </TouchableOpacity>
        <Text style={styles.note}>Wallet coins may be deducted. Previously unlocked contacts are free to reopen.</Text>
      </>}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24},
  modal: {backgroundColor: colors.white, borderRadius: 28, width: '100%', maxWidth: 420, maxHeight: '85%', flexGrow: 0},
  modalContent: {padding: 24},
  modalTitle: {fontSize: 22, color: colors.text, marginBottom: 24},
  memberName: {fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 20},
  priceRow: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginVertical: 16},
  priceLabel: {fontSize: 16, color: colors.text},
  priceValue: {fontSize: 16, fontWeight: '600', color: colors.text},
  modalActions: {flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 24},
  cancel: {minHeight: 48, padding: 12, justifyContent: 'center'},
  confirm: {marginTop: 0, paddingHorizontal: 24, borderRadius: 24},
  disabled: {opacity: 0.5},
  card: {backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 14},
  heading: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12},
  title: {fontSize: 16, fontWeight: '700', color: colors.text},
  row: {marginVertical: 6, gap: 4},
  label: {fontSize: 12, color: colors.textSecondary},
  value: {fontSize: 14, color: colors.text},
  note: {fontSize: 12, lineHeight: 19, color: colors.textSecondary, marginVertical: 8},
  error: {fontSize: 13, color: colors.error, marginTop: 12},
  button: {backgroundColor: colors.primary, borderRadius: 12, minHeight: 48, padding: 12, justifyContent: 'center', alignItems: 'center', marginTop: 12},
  buttonText: {color: colors.white, fontWeight: '700', fontSize: 13},
});
