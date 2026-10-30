import React from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AppIcon from '../../../components/AppIcon';
import {INFORMATION_PAGES} from '../../../api/informationApi';
import colors from '../../../theme/colors';

const descriptions = {
  about: 'About HimShaadi and app information',
  privacy: 'How your information is handled',
  terms: 'Terms and conditions for using HimShaadi',
  refund: 'Refund and cancellation policy',
};

export default function SettingsPrivacyScreen({navigation}) {
  return (
    <SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>Learn about HimShaadi and review our policies.</Text>
        <View style={styles.card}>
          {Object.entries(INFORMATION_PAGES).map(([page, item], index) => (
            <TouchableOpacity
              key={page}
              accessibilityRole="button"
              style={[styles.row, index > 0 && styles.divider]}
              onPress={() => navigation.navigate('Information', {page})}>
              <View style={styles.icon}><AppIcon name={item.icon} size={22} /></View>
              <View style={styles.label}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{descriptions[page]}</Text>
              </View>
              <AppIcon name="next" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  content: {padding: 20},
  intro: {fontSize: 15, lineHeight: 23, color: colors.textSecondary, marginBottom: 20},
  card: {backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 20, minHeight: 72},
  divider: {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border},
  icon: {backgroundColor: colors.primaryLight, padding: 10, borderRadius: 12},
  label: {flex: 1},
  title: {fontSize: 16, fontWeight: '700', color: colors.title},
  subtitle: {fontSize: 13, lineHeight: 20, color: colors.textSecondary, marginTop: 5},
});
