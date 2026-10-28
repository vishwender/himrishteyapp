import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../theme/colors';

export default function WalletAmountModal({ visible, onClose }) {
  const [amount, setAmount] = useState('');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => setAmount('')}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.card} accessibilityViewIsModal>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Add Money</Text>
            <Text style={styles.label}>Enter amount</Text>
            <TextInput
              accessibilityLabel="Enter amount"
              placeholder="Enter amount"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              style={styles.input}
            />
            <View style={styles.options}>
              {[100, 200, 500, 1000].map(value => (
                <TouchableOpacity
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ₹${value}`}
                  accessibilityState={{ selected: amount === String(value) }}
                  style={[
                    styles.option,
                    amount === String(value) && styles.selected,
                  ]}
                  onPress={() => setAmount(String(value))}
                >
                  <Text style={styles.optionText}>
                    ₹{value.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    maxHeight: '90%',
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.title,
    marginBottom: 20,
  },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#E9E3F0',
    borderRadius: 11,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  option: {
    borderWidth: 1,
    borderColor: '#E9E3F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  selected: { borderColor: colors.primary, backgroundColor: '#F2EDFF' },
  optionText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  closeButton: {
    backgroundColor: colors.primary,
    borderRadius: 11,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  closeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
