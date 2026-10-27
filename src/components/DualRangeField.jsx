import React, { useRef } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import colors from '../theme/colors';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export default function DualRangeField({
  label,
  lower,
  upper,
  min,
  max,
  onChange,
  format = String,
  tickStep = 5,
  disabled = false,
}) {
  const track = useRef(null);
  const geometry = useRef({ x: 0, width: 1 });
  const active = useRef('lower');
  const overlapping = useRef(false);
  const low = clamp(lower === '' ? min : Number(lower), min, max);
  const high = Math.max(
    low,
    clamp(upper === '' ? max : Number(upper), min, max),
  );
  const latest = useRef(null);
  latest.current = { low, high, onChange, disabled, min, max };
  const percent = value => ((value - min) / (max - min)) * 100;
  const emit = (endpoint, value) => {
    const current = latest.current;
    if (current.disabled) return;
    const nextLow =
      endpoint === 'lower'
        ? clamp(value, current.min, current.high)
        : current.low;
    const nextHigh =
      endpoint === 'upper'
        ? clamp(value, current.low, current.max)
        : current.high;
    current.onChange({ lower: String(nextLow), upper: String(nextHigh) });
  };
  const touchValue = pageX =>
    Math.round(
      min +
        ((pageX - geometry.current.x) / geometry.current.width) * (max - min),
    );
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: event => {
      const pageX = event.nativeEvent.pageX;
      track.current?.measureInWindow((x, y, width) => {
        geometry.current = { x, width: width || 1 };
        const value = touchValue(pageX),
          current = latest.current;
        overlapping.current = current.low === current.high;
        active.current =
          Math.abs(value - current.low) < Math.abs(value - current.high)
            ? 'lower'
            : 'upper';
        if (!overlapping.current) emit(active.current, value);
      });
    },
    onPanResponderMove: event => {
      const value = touchValue(event.nativeEvent.pageX);
      if (overlapping.current) {
        if (value === latest.current.low) return;
        active.current = value < latest.current.low ? 'lower' : 'upper';
        overlapping.current = false;
      }
      emit(active.current, value);
    },
    onPanResponderTerminationRequest: () => false,
  });
  const ticks = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <View style={styles.field}>
      <Text style={styles.heading}>
        {label} ({lower === '' ? '—' : format(Number(lower))}–
        {upper === '' ? '—' : format(Number(upper))})
      </Text>
      <View style={styles.inset}>
        <View ref={track} style={styles.trackTouch} {...responder.panHandlers}>
          <View pointerEvents="none" style={styles.rail} />
          <View
            pointerEvents="none"
            style={[
              styles.fill,
              {
                left: `${percent(low)}%`,
                width: `${percent(high) - percent(low)}%`,
              },
            ]}
          />
          {ticks.map(value => (
            <View
              pointerEvents="none"
              key={value}
              style={[
                styles.tick,
                (value - min) % tickStep === 0
                  ? styles.majorTick
                  : styles.minorTick,
                {
                  left: `${percent(value)}%`,
                },
              ]}
            />
          ))}
          {['lower', 'upper'].map(endpoint => {
            const value = endpoint === 'lower' ? low : high;
            return (
              <View
                key={endpoint}
                style={[styles.thumbTouch, { left: `${percent(value)}%` }]}
                accessible
                accessibilityRole="adjustable"
                accessibilityLabel={`${
                  endpoint === 'lower' ? 'Minimum' : 'Maximum'
                } ${label.toLowerCase()}`}
                accessibilityState={{ disabled }}
                accessibilityValue={{
                  min: endpoint === 'lower' ? min : low,
                  max: endpoint === 'upper' ? max : high,
                  now: value,
                  text: format(value),
                }}
                accessibilityActions={[
                  { name: 'increment' },
                  { name: 'decrement' },
                ]}
                onAccessibilityAction={event => {
                  const direction = event.nativeEvent.actionName;
                  if (direction === 'increment' || direction === 'decrement')
                    emit(
                      endpoint,
                      value + (direction === 'increment' ? 1 : -1),
                    );
                }}
              >
                <View style={styles.thumb} />
              </View>
            );
          })}
        </View>
        <View style={styles.labels}>
          {ticks
            .filter(value => (value - min) % tickStep === 0)
            .map(value => (
              <Text
                key={value}
                style={[styles.tickLabel, { left: `${percent(value)}%` }]}
              >
                {format(value)}
              </Text>
            ))}
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  field: { marginBottom: 24 },
  heading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  inset: { marginHorizontal: 18 },
  trackTouch: { height: 48, justifyContent: 'center' },
  rail: {
    position: 'absolute',
    height: 4,
    borderRadius: 3,
    backgroundColor: colors.primaryLight,
    left: 0,
    right: 0,
    top: 20,
  },
  fill: {
    position: 'absolute',
    height: 6,
    backgroundColor: colors.primary,
    top: 19,
    borderRadius: 3,
  },
  tick: {
    position: 'absolute',
    top: 28,
    width: 1,
    backgroundColor: colors.textSecondary,
  },
  majorTick: { height: 9 },
  minorTick: { height: 5 },
  thumbTouch: {
    position: 'absolute',
    width: 40,
    height: 48,
    marginLeft: -20,
    top: -2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    elevation: 2,
  },
  labels: { height: 32 },
  tickLabel: {
    position: 'absolute',
    width: 44,
    marginLeft: -22,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
    color: colors.textSecondary,
  },
});
