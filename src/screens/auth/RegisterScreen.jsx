import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import colors from '../../theme/colors';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Account</Text>
      <Text style={styles.subtitle}>
        Your journey to finding a life partner starts here.
      </Text>
      <Text style={styles.note}>
        Registration form coming next.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  note: {
    marginTop: 24,
    color: colors.primary,
  },
});