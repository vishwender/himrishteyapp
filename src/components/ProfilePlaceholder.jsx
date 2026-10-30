import React from 'react';
import {Image, StyleSheet, View} from 'react-native';
import AppIcon from './AppIcon';
import colors from '../theme/colors';

export function getProfilePlaceholder(gender) {
  const value = String(gender || '').trim().toLowerCase();
  if (['male', 'm'].includes(value)) return require('../../assets/placeholders/profile-male-square.png');
  if (['female', 'f'].includes(value)) return require('../../assets/placeholders/profile-female-square.png');
  return null;
}

export default function ProfilePlaceholder({gender, style}) {
  const source = getProfilePlaceholder(gender);
  return source ? (
    <Image source={source} style={[styles.image, style]} resizeMode="contain" accessibilityLabel="Profile photo placeholder" />
  ) : (
    <View style={[styles.neutral, style]} accessibilityLabel="Profile photo unavailable">
      <AppIcon name="user" size={28} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {width: '100%', height: '100%'},
  neutral: {width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight},
});
