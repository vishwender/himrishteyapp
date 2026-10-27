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

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const pad = value => String(value).padStart(2, '0');
const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

function SelectionColumn({ label, options, value, onSelect }) {
  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <FlatList
        key={`${label}-${options.length}`}
        data={options}
        keyExtractor={item => String(item.value)}
        initialScrollIndex={Math.max(
          0,
          options.findIndex(item => item.value === value),
        )}
        getItemLayout={(_, index) => ({
          length: 52,
          offset: 52 * index,
          index,
        })}
        renderItem={({ item }) => (
          <TouchableOpacity
            accessibilityRole="radio"
            accessibilityLabel={`${label} ${item.label}`}
            accessibilityState={{ selected: item.value === value }}
            onPress={() => onSelect(item.value)}
            style={[styles.option, item.value === value && styles.selected]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.optionText,
                item.value === value && styles.selectedText,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

export default function DateTimeField({
  label,
  mode,
  value,
  onChange,
  disabled,
  invalid,
}) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState({});
  const isDate = mode === 'date';
  const today = new Date();
  const open = () => {
    if (disabled) return;
    if (isDate) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
      setDraft(
        match
          ? { year: +match[1], month: +match[2], day: +match[3] }
          : {
              year: today.getFullYear(),
              month: today.getMonth() + 1,
              day: today.getDate(),
            },
      );
    } else {
      const match = /^(\d{2}):(\d{2}) (AM|PM)$/.exec(value || '');
      setDraft(
        match
          ? { hour: +match[1], minute: +match[2], period: match[3] }
          : { hour: 12, minute: 0, period: 'AM' },
      );
    }
    setVisible(true);
  };
  const update = (key, selected) =>
    setDraft(previous => {
      const next = { ...previous, [key]: selected };
      if (isDate)
        next.day = Math.min(next.day, daysInMonth(next.year, next.month));
      return next;
    });
  const future =
    isDate && new Date(draft.year, draft.month - 1, draft.day) > today;
  const confirm = () => {
    if (future) return;
    onChange(
      isDate
        ? `${draft.year}-${pad(draft.month)}-${pad(draft.day)}`
        : `${pad(draft.hour)}:${pad(draft.minute)} ${draft.period}`,
    );
    setVisible(false);
  };
  const dateParts = isDate && value ? value.split('-') : null;
  const display = dateParts
    ? `${Number(dateParts[2])} ${MONTHS[Number(dateParts[1]) - 1]} ${
        dateParts[0]
      }`
    : value;
  const numbers = (count, start = 0) =>
    Array.from({ length: count }, (_, i) => ({
      value: start + i,
      label: pad(start + i),
    }));

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: display || 'Not selected' }}
        accessibilityState={{ disabled: Boolean(disabled) }}
        disabled={disabled}
        onPress={open}
        style={[styles.field, invalid && styles.invalid]}
      >
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {display || `Select ${label.toLowerCase()}`}
        </Text>
        <Text style={styles.indicator}>▾</Text>
      </TouchableOpacity>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityLabel="Cancel selection"
            accessibilityRole="button"
            style={StyleSheet.absoluteFill}
            onPress={() => setVisible(false)}
          />
          <View accessibilityViewIsModal style={styles.dialog}>
            <Text accessibilityRole="header" style={styles.title}>
              {label}
            </Text>
            <View style={styles.columns}>
              {isDate ? (
                <>
                  <SelectionColumn
                    label="Day"
                    value={draft.day}
                    options={numbers(daysInMonth(draft.year, draft.month), 1)}
                    onSelect={selected => update('day', selected)}
                  />
                  <SelectionColumn
                    label="Month"
                    value={draft.month}
                    options={MONTHS.map((month, i) => ({
                      value: i + 1,
                      label: month,
                    }))}
                    onSelect={selected => update('month', selected)}
                  />
                  <SelectionColumn
                    label="Year"
                    value={draft.year}
                    options={Array.from(
                      { length: today.getFullYear() - 1899 },
                      (_, i) => ({
                        value: today.getFullYear() - i,
                        label: String(today.getFullYear() - i),
                      }),
                    )}
                    onSelect={selected => update('year', selected)}
                  />
                </>
              ) : (
                <>
                  <SelectionColumn
                    label="Hour"
                    value={draft.hour}
                    options={numbers(12, 1)}
                    onSelect={selected => update('hour', selected)}
                  />
                  <SelectionColumn
                    label="Minute"
                    value={draft.minute}
                    options={numbers(60)}
                    onSelect={selected => update('minute', selected)}
                  />
                  <SelectionColumn
                    label="Period"
                    value={draft.period}
                    options={['AM', 'PM'].map(period => ({
                      value: period,
                      label: period,
                    }))}
                    onSelect={selected => update('period', selected)}
                  />
                </>
              )}
            </View>
            {future ? (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                Date of birth cannot be in the future.
              </Text>
            ) : null}
            <View style={styles.actions}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setVisible(false)}
                style={styles.action}
              >
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ disabled: future }}
                disabled={future}
                onPress={confirm}
                style={[styles.action, styles.done, future && styles.disabled]}
              >
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
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
  fieldText: { fontSize: 16, color: colors.text, flex: 1 },
  placeholder: { color: colors.textSecondary },
  indicator: { color: colors.primary, fontSize: 20 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  columns: { flexDirection: 'row', height: 260, gap: 8, flexShrink: 1 },
  column: { flex: 1 },
  columnLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  option: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  selected: { backgroundColor: colors.primaryLight },
  optionText: { fontSize: 18, color: colors.text },
  selectedText: { color: colors.primary, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  action: {
    flex: 1,
    minHeight: 48,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  cancel: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  done: { backgroundColor: colors.primary },
  doneText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  error: { color: colors.error, marginTop: 12 },
});
