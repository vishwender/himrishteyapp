import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import AppIcon from './AppIcon';
import {isVerifiedMember} from '../services/memberVerification';
import colors from '../theme/colors';

export default function VerifiedBadge({member}) {
  if (!isVerifiedMember(member)) {
    return null;
  }

  return (
    <View style={styles.badge}>
      <AppIcon name="verified" size={13} color={colors.white} />
      <Text style={styles.text}>Verified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: '#079D69',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  text: {color: colors.white, fontSize: 10, fontWeight: '800'},
});
