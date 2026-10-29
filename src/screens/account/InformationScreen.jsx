import React, {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {getInformationPage, INFORMATION_PAGES} from '../../api/informationApi';
import AppIcon from '../../components/AppIcon';
import colors from '../../theme/colors';
import {version} from '../../../package.json';

export default function InformationScreen({route, navigation}) {
  const key = route.params?.page || 'about';
  const page = INFORMATION_PAGES[key];
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({loading: true});

  useEffect(() => {
    const controller = new AbortController();
    setState({loading: true});
    getInformationPage(key, controller.signal).then(
      result => {
        if (!controller.signal.aborted) setState(result);
      },
      () => {
        if (!controller.signal.aborted) {
          setState({error: 'Unable to load this page. Check your connection and try again.'});
        }
      },
    );
    return () => controller.abort();
  }, [key, attempt]);

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.icon}><AppIcon name={page?.icon || 'heart'} size={30} /></View>
          <Text accessibilityRole="header" style={styles.title}>{page?.title || 'Information'}</Text>
          {key === 'about' ? <Text style={styles.subtitle}>HimShaadi · Version {version}</Text> : null}
        </View>
        <View style={styles.card}>
          {state.loading ? (
            <View accessibilityLiveRegion="polite">
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.message}>Loading {page?.title || 'page'}…</Text>
            </View>
          ) : state.error ? (
            <View>
              <Text accessibilityRole="alert" style={styles.message}>{state.error}</Text>
              <TouchableOpacity accessibilityRole="button" style={styles.retry} onPress={() => setAttempt(value => value + 1)}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text selectable style={styles.body}>{state.content || 'This page has not been published yet. Please check again later.'}</Text>
          )}
        </View>
        {key === 'about' ? (
          <View style={styles.card}>
            {['privacy', 'terms', 'refund'].map(item => (
              <TouchableOpacity key={item} accessibilityRole="button" style={styles.link} onPress={() => navigation.push('Information', {page: item, title: INFORMATION_PAGES[item].title})}>
                <Text style={styles.linkText}>{INFORMATION_PAGES[item].title}</Text>
                <AppIcon name="next" />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  content: {padding: 20, gap: 18},
  hero: {alignItems: 'center', paddingVertical: 12},
  icon: {padding: 18, borderRadius: 24, backgroundColor: colors.primaryLight, marginBottom: 16},
  title: {fontSize: 25, fontWeight: '800', color: colors.title, textAlign: 'center'},
  subtitle: {fontSize: 14, color: colors.textSecondary, marginTop: 8},
  card: {padding: 20, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border},
  body: {fontSize: 16, lineHeight: 27, color: colors.text},
  message: {fontSize: 15, lineHeight: 23, color: colors.textSecondary, textAlign: 'center', marginTop: 12},
  retry: {minHeight: 48, justifyContent: 'center', alignItems: 'center', marginTop: 16, backgroundColor: colors.primary, borderRadius: 12},
  retryText: {fontSize: 16, fontWeight: '700', color: colors.white},
  link: {minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12},
  linkText: {flex: 1, fontSize: 16, fontWeight: '600', color: colors.primary},
});
