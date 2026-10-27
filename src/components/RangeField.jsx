import React, { useRef } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import colors from '../theme/colors';
export default function RangeField({
  label,
  value,
  min,
  max,
  onChange,
  format = String,
  disabled = false,
}) {
  const track = useRef(null);
  const geometry = useRef({ x: 0, width: 1 });
  const selected = Math.min(max, Math.max(min, Number(value) || min));
  const setFromTouch = pageX => {
    const { x, width } = geometry.current;
    onChange(
      String(
        Math.min(
          max,
          Math.max(min, Math.round(min + ((pageX - x) / width) * (max - min))),
        ),
      ),
    );
  };
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: event => {
      const x = event.nativeEvent.pageX;
      track.current?.measureInWindow((left, top, width) => {
        geometry.current = { x: left, width: width || 1 };
        setFromTouch(x);
      });
    },
    onPanResponderMove: event => setFromTouch(event.nativeEvent.pageX),
    onPanResponderTerminationRequest: () => false,
  });
  const percent = max === min ? 0 : ((selected - min) / (max - min)) * 100;
  return (
    <View style={styles.field}>
      <View style={styles.heading}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {value === '' ? 'Not specified' : format(Number(value))}
        </Text>
      </View>
      <View
        ref={track}
        style={styles.slider}
        {...responder.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        accessibilityValue={{ min, max, now: selected, text: format(selected) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={event => {
          if (disabled) return;
          const delta = event.nativeEvent.actionName === 'increment' ? 1 : -1;
          onChange(String(Math.max(min, Math.min(max, selected + delta))));
        }}
      >
        <View pointerEvents="none" style={styles.rail}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
        <View
          pointerEvents="none"
          style={[styles.thumb, { left: `${percent}%` }]}
        />
      </View>
      <View style={styles.heading}>
        <Text style={styles.hint}>{format(min)}</Text>
        <Text style={styles.hint}>{format(max)}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  field: { marginBottom: 20, paddingHorizontal: 12 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  label: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.text },
  value: { color: colors.primary, fontWeight: '700' },
  slider: { height: 48, justifyContent: 'center' },
  rail: { height: 6, backgroundColor: colors.primaryLight, borderRadius: 3 },
  fill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    marginLeft: -12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    top: 12,
  },
  hint: { fontSize: 12, color: colors.textSecondary },
});
