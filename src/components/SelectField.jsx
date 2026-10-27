import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../theme/colors';

export default function SelectField({
  label,
  options,
  value,
  onChange,
  disabled,
  invalid,
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value || 'Not selected' }}
        accessibilityState={{ disabled: Boolean(disabled) }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.field, invalid && styles.invalid]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value || `Select ${label.toLowerCase()}`}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="Cancel selection"
            onPress={() => setOpen(false)}
          />
          <View accessibilityViewIsModal style={styles.dialog}>
            <Text accessibilityRole="header" style={styles.title}>
              {label}
            </Text>
            <FlatList
              data={options}
              keyExtractor={item => item}
              extraData={value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  accessibilityRole="radio"
                  accessibilityLabel={item}
                  accessibilityState={{ selected: item === value }}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  style={[styles.option, item === value && styles.selected]}
                >
                  <Text style={styles.optionText}>{item}</Text>
                  {item === value ? <Text style={styles.check}>✓</Text> : null}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setOpen(false)}
              style={styles.cancel}
            >
              <Text style={styles.check}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  field: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  invalid: { borderColor: colors.error },
  value: { flex: 1, color: colors.text, fontSize: 16 },
  placeholder: { color: colors.textSecondary },
  arrow: { fontSize: 20, color: colors.primary },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 20,
  },
  dialog: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  option: {
    minHeight: 52,
    padding: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  selected: { backgroundColor: colors.primaryLight },
  optionText: { flex: 1, fontSize: 16, color: colors.text },
  check: { fontSize: 16, color: colors.primary, fontWeight: '700' },
  cancel: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
});
