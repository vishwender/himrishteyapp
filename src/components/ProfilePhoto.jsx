import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from './AppIcon';
import ProfilePlaceholder from './ProfilePlaceholder';
import colors from '../theme/colors';

export default function ProfilePhoto({
  uri,
  gender,
  style,
  accessibilityLabel = 'Profile photo',
  onError,
}) {
  const [openedUri, setOpenedUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  const [failedThumbnail, setFailedThumbnail] = useState(null);
  useEffect(() => {
    setOpenedUri(null);
  }, [uri]);
  const visible = Boolean(uri && openedUri === uri);
  const close = () => setOpenedUri(null);
  const open = () => {
    setFailed(false);
    setLoading(true);
    setOpenedUri(uri);
  };
  const retry = () => {
    setFailed(false);
    setLoading(true);
    setRevision(value => value + 1);
  };
  return (
    <>
      <TouchableOpacity
        style={style}
        accessibilityRole="button"
        accessibilityLabel={`Open ${accessibilityLabel.toLowerCase()}`}
        accessibilityHint="View the full image"
        onPress={open}
        disabled={!uri || failedThumbnail === uri}
        activeOpacity={0.9}
      >
        {uri && failedThumbnail !== uri ? <Image
          source={{ uri }}
          style={styles.thumbnail}
          resizeMode="cover"
          onError={event => {setFailedThumbnail(uri); onError?.(event);}}
          accessible={false}
        /> : <ProfilePlaceholder gender={gender} />}
      </TouchableOpacity>
      {visible ? (
        <Modal
          visible
          animationType="fade"
          presentationStyle="fullScreen"
          onRequestClose={close}
        >
          <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
              <Text accessibilityRole="header" style={styles.title}>
                Profile photo
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close photo"
                onPress={close}
                style={styles.close}
              >
                <AppIcon name="close" color={colors.title} size={26} />
              </TouchableOpacity>
            </View>
            <View style={styles.imageArea}>
              {failed ? (
                <View style={styles.error} accessibilityLiveRegion="polite">
                  <Text style={styles.message}>
                    Unable to load the full photo.
                  </Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={retry}
                    style={styles.retry}
                  >
                    <Text style={styles.message}>Retry photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Image
                  key={`${uri}-${revision}`}
                  source={{ uri }}
                  style={styles.fullImage}
                  resizeMode="contain"
                  accessibilityLabel={accessibilityLabel}
                  onLoadEnd={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setFailed(true);
                  }}
                />
              )}
              {loading ? (
                <ActivityIndicator
                  color={colors.white}
                  size="large"
                  accessibilityLabel="Loading full photo"
                  style={styles.loading}
                />
              ) : null}
            </View>
          </SafeAreaView>
        </Modal>
      ) : null}
    </>
  );
}
const styles = StyleSheet.create({
  thumbnail: { width: '100%', height: '100%' },
  screen: { flex: 1, backgroundColor: '#000000' },
  header: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: { flex: 1, color: colors.title, fontSize: 19, fontWeight: '700' },
  close: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageArea: { flex: 1 },
  fullImage: { width: '100%', height: '100%' },
  loading: { ...StyleSheet.absoluteFillObject },
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  message: { color: colors.white, textAlign: 'center', fontSize: 16 },
  retry: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 24,
  },
});
