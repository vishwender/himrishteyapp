import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import { API_CONFIG } from '../../config/api';
import SelectField from '../../components/SelectField';
import DateTimeField from '../../components/DateTimeField';
import { getAuthError } from '../../api/authApi';
import {
  submitRegistrationStep,
  getRegistrationFailure,
} from '../../api/registrationApi';
import {
  REGISTRATION_STEPS,
  registrationPayload,
  validateRegistrationStep,
} from '../../features/registration/registrationForm';

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [started, setStarted] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [picking, setPicking] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const memberId = useRef(null);
  const pickerLock = useRef(false);
  const [profileId, setProfileId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const lock = useRef(false);
  const alive = useRef(true);
  const controller = useRef(null);
  const scroll = useRef(null);
  const accountDetailsLocked = accountCreated && step <= 3;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current?.abort();
    };
  }, []);

  usePreventRemove(
    !complete && (busy || started || Object.keys(values).length > 0),
    ({ data }) => {
      if (lock.current) {
        Alert.alert(
          'Registration in progress',
          'Please wait for the current request to finish.',
        );
        return;
      }
      if (
        step > 1 &&
        (data.action.type === 'GO_BACK' || data.action.type === 'POP')
      ) {
        moveTo(step - 1);
        return;
      }
      Alert.alert(
        'Leave registration?',
        started
          ? 'Your account may already exist. You can log in and finish your profile later. Unsaved details will be cleared.'
          : 'Your unsaved registration details will be cleared.',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', onPress: () => navigation.dispatch(data.action) },
        ],
      );
    },
  );

  const moveTo = target => {
    setStep(target);
    setErrors({});
    setError('');
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  const openTerms = async () => {
    try {
      const website = API_CONFIG.baseURL.replace(/\/api\/v1\/?$/, '');
      await Linking.openURL(`${website}/terms-and-conditions`);
    } catch {
      if (alive.current)
        setError('Unable to open Terms and Conditions. Please try again.');
    }
  };

  const choosePhoto = () => {
    if (lock.current || pickerLock.current) return;
    Alert.alert('Add profile photo', 'Choose how to add your photo.', [
      { text: 'Take photo', onPress: () => openPhotoPicker('camera') },
      {
        text: 'Choose from library',
        onPress: () => openPhotoPicker('library'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openPhotoPicker = async source => {
    if (!alive.current || lock.current || pickerLock.current) return;
    pickerLock.current = true;
    setPicking(true);
    try {
      const result =
        source === 'camera'
          ? await launchCamera({
              mediaType: 'photo',
              cameraType: 'front',
              saveToPhotos: false,
            })
          : await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
      if (!alive.current || result.didCancel) return;
      if (result.errorCode === 'camera_unavailable')
        throw new Error(
          'Camera is not available on this device. Choose a photo from your library.',
        );
      if (result.errorCode === 'permission')
        throw new Error(
          'Photo access was denied. Check camera or photo permissions in Settings, then try again.',
        );
      if (result.errorCode)
        throw new Error(
          'Unable to open the camera or photo library. Please try again.',
        );
      const asset = result.assets?.[0];
      if (
        !asset?.uri ||
        !['image/jpeg', 'image/png', 'image/webp'].includes(asset.type) ||
        !asset.fileSize ||
        asset.fileSize > 5 * 1024 * 1024
      ) {
        throw new Error('Choose a JPG, PNG or WebP photo up to 5 MB.');
      }
      setPhoto({
        uri: asset.uri,
        type: asset.type,
        name: `profile.${
          asset.type === 'image/jpeg' ? 'jpg' : asset.type.split('/')[1]
        }`,
      });
      setError('');
    } catch (err) {
      if (alive.current) setError(err.message);
    } finally {
      pickerLock.current = false;
      if (alive.current) setPicking(false);
    }
  };

  const finish = async () => {
    if (lock.current || uncertain || pickerLock.current) return;
    const apiStep = step - 2;
    if (apiStep === 1 && memberId.current) {
      moveTo(4);
      return;
    }
    const first = apiStep === 1 ? 1 : step;
    for (let current = first; current <= step; current++) {
      const invalid = validateRegistrationStep(current, values);
      if (Object.keys(invalid).length) {
        moveTo(current);
        setErrors(invalid);
        return;
      }
    }
    lock.current = true;
    setBusy(true);
    setStarted(true);
    setError('');
    controller.current = new AbortController();
    try {
      const data = await submitRegistrationStep(
        apiStep,
        memberId.current,
        apiStep === 5
          ? photo
            ? { photo }
            : {}
          : registrationPayload(values, apiStep),
        controller.current.signal,
      );
      if (!alive.current) return;
      if (data.member.profile_id) setProfileId(data.member.profile_id);
      if (apiStep === 1) {
        memberId.current = data.member.id;
        setAccountCreated(true);
        setValues(previous => ({ ...previous, password: '' }));
      }
      if (apiStep === 5) {
        setValues({});
        setPhoto(null);
        setComplete(true);
      } else {
        moveTo(step + 1);
      }
    } catch (err) {
      if (!alive.current) return;
      const failure = getRegistrationFailure(err, apiStep);
      const ambiguous = failure.uncertain;
      setUncertain(ambiguous);
      const serverErrors = { ...err.response?.data?.errors };
      const field = err.response?.data?.field;
      if (field) serverErrors[field] = [err.response.data.message];
      if (!ambiguous && Object.keys(serverErrors).length) {
        const invalidStep = REGISTRATION_STEPS.findIndex(item =>
          item.fields.some(fieldItem => serverErrors[fieldItem.key]),
        );
        moveTo(apiStep === 1 ? (invalidStep >= 0 ? invalidStep + 1 : 3) : step);
        setErrors(
          Object.fromEntries(
            Object.entries(serverErrors).map(([key, messages]) => [
              key,
              Array.isArray(messages) ? messages[0] : String(messages),
            ]),
          ),
        );
      }
      setError(failure.message || getAuthError(err));
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  };

  const continueForm = () => {
    if (lock.current) return;
    const invalid = validateRegistrationStep(step, values);
    setErrors(invalid);
    if (Object.keys(invalid).length) return;
    moveTo(step + 1);
  };

  if (complete) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.root}>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>
            Welcome to HimShaadi
          </Text>
          <Text style={styles.description}>Your registration is complete.</Text>
          {profileId ? (
            <Text selectable style={styles.profileId}>
              Profile ID: {profileId}
            </Text>
          ) : null}
          <Text style={styles.description}>
            Log in with your email, phone number or Profile ID and password to
            discover matches.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.primary}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.primaryText}>Go to login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.root}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Text style={styles.brand}>HimShaadi</Text>
          <Text style={styles.description}>
            A beautiful beginning starts with you.
          </Text>
          <View style={styles.card}>
            <Text style={styles.step}>
              Step {step} of {REGISTRATION_STEPS.length}
            </Text>
            <Text accessibilityRole="header" style={styles.title}>
              {REGISTRATION_STEPS[step - 1].title}
            </Text>
            <Text style={styles.description}>
              {step === 3
                ? 'Add your details and agree to the Terms and Conditions to create your account.'
                : step === 7
                ? 'Choose a photo up to 5 MB, or skip and add it later.'
                : step > 3
                ? 'Add your profile details to continue.'
                : 'Choose an option to continue.'}
            </Text>
            {accountCreated ? (
              <Text style={styles.step}>
                Account created{profileId ? ` · ${profileId}` : ''}
              </Text>
            ) : null}
            {accountDetailsLocked ? (
              <Text style={styles.description}>
                These account details have already been submitted. You can edit
                them from your profile after logging in.
              </Text>
            ) : null}
            {REGISTRATION_STEPS[step - 1].fields
              .filter(field => !(accountDetailsLocked && field.secret))
              .map(field => (
                <View key={field.key} style={styles.field}>
                  <Text style={styles.label}>{field.label}</Text>
                  {field.options ? (
                    <SelectField
                      label={field.label}
                      options={field.options}
                      value={values[field.key] || ''}
                      disabled={busy || uncertain || accountDetailsLocked}
                      invalid={Boolean(errors[field.key])}
                      onChange={value => {
                        setValues(previous => ({
                          ...previous,
                          [field.key]: value,
                        }));
                        setErrors(previous => ({
                          ...previous,
                          [field.key]: '',
                        }));
                      }}
                    />
                  ) : field.picker ? (
                    <DateTimeField
                      label={field.label}
                      mode={field.picker}
                      value={values[field.key] || ''}
                      disabled={busy || uncertain || accountDetailsLocked}
                      invalid={Boolean(errors[field.key])}
                      onChange={value => {
                        setValues(previous => ({
                          ...previous,
                          [field.key]: value,
                        }));
                        setErrors(previous => ({
                          ...previous,
                          [field.key]: '',
                        }));
                      }}
                    />
                  ) : field.choices ? (
                    <View style={styles.choices}>
                      {field.choices.map(choice => (
                        <TouchableOpacity
                          key={choice}
                          accessibilityRole="radio"
                          accessibilityLabel={choice}
                          accessibilityState={{
                            selected: values[field.key] === choice,
                          }}
                          disabled={busy || uncertain || accountDetailsLocked}
                          onPress={() => {
                            setValues(previous => ({
                              ...previous,
                              [field.key]: choice,
                            }));
                            setErrors(previous => ({
                              ...previous,
                              [field.key]: '',
                            }));
                          }}
                          style={[
                            styles.choice,
                            values[field.key] === choice && styles.chosen,
                          ]}
                        >
                          <Text style={styles.link}>
                            {choice[0].toUpperCase() + choice.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <TextInput
                      accessibilityLabel={field.label}
                      editable={!busy && !uncertain && !accountDetailsLocked}
                      value={values[field.key] || ''}
                      onChangeText={value => {
                        setValues(previous => ({
                          ...previous,
                          [field.key]: value,
                        }));
                        setErrors(previous => ({
                          ...previous,
                          [field.key]: '',
                        }));
                      }}
                      placeholder={field.placeholder || field.label}
                      placeholderTextColor={colors.textSecondary}
                      keyboardType={field.keyboard || 'default'}
                      autoCapitalize={
                        field.secret || field.key === 'email'
                          ? 'none'
                          : 'sentences'
                      }
                      autoCorrect={false}
                      secureTextEntry={field.secret && !showPassword}
                      maxLength={field.secret ? undefined : field.max || 255}
                      style={[
                        styles.input,
                        errors[field.key] && styles.invalid,
                      ]}
                    />
                  )}
                  {errors[field.key] ? (
                    <Text accessibilityLiveRegion="polite" style={styles.error}>
                      {errors[field.key]}
                    </Text>
                  ) : null}
                </View>
              ))}
            {step === 3 && !accountCreated ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setShowPassword(value => !value)}
              >
                <Text style={styles.link}>
                  {showPassword ? 'Hide passwords' : 'Show passwords'}
                </Text>
              </TouchableOpacity>
            ) : null}
            {step === 3 ? (
              <View style={styles.terms}>
                <TouchableOpacity
                  accessibilityRole="checkbox"
                  accessibilityLabel="I agree to the Terms and Conditions"
                  accessibilityState={{
                    checked: values.agreed_to_terms === true,
                    disabled: busy || uncertain || accountDetailsLocked,
                  }}
                  disabled={busy || uncertain || accountDetailsLocked}
                  style={styles.agreement}
                  onPress={() => {
                    setValues(previous => ({
                      ...previous,
                      agreed_to_terms: !previous.agreed_to_terms,
                    }));
                    setErrors(previous => ({
                      ...previous,
                      agreed_to_terms: '',
                    }));
                  }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      values.agreed_to_terms && styles.checked,
                    ]}
                  >
                    <Text style={styles.checkmark}>
                      {values.agreed_to_terms ? '✓' : ''}
                    </Text>
                  </View>
                  <Text style={styles.agreementText}>
                    I agree to the Terms and Conditions
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="link"
                  onPress={openTerms}
                  style={styles.secondary}
                >
                  <Text style={styles.link}>Read Terms and Conditions</Text>
                </TouchableOpacity>
                {errors.agreed_to_terms ? (
                  <Text accessibilityLiveRegion="polite" style={styles.error}>
                    {errors.agreed_to_terms}
                  </Text>
                ) : null}
              </View>
            ) : null}
            {step === 7 ? (
              <View>
                {photo ? (
                  <Image
                    source={{ uri: photo.uri }}
                    accessibilityLabel="Selected profile photo"
                    style={styles.photo}
                    resizeMode="contain"
                  />
                ) : null}
                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={busy || picking}
                  onPress={choosePhoto}
                  style={styles.secondary}
                >
                  <Text style={styles.link}>
                    {picking
                      ? 'Opening photo picker…'
                      : photo
                      ? 'Change photo'
                      : 'Choose photo'}
                  </Text>
                </TouchableOpacity>
                {photo ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    disabled={busy || picking}
                    onPress={() => setPhoto(null)}
                    style={styles.secondary}
                  >
                    <Text style={styles.link}>Remove photo</Text>
                  </TouchableOpacity>
                ) : null}
                {errors.photo ? (
                  <Text style={styles.error}>{errors.photo}</Text>
                ) : null}
              </View>
            ) : null}
            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
            {busy ? (
              <View accessibilityLiveRegion="polite" style={styles.status}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.description}>
                  {accountCreated
                    ? 'Saving your profile…'
                    : 'Creating your account…'}
                </Text>
              </View>
            ) : null}
            {!uncertain ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ disabled: busy || picking, busy }}
                disabled={busy || picking}
                style={styles.primary}
                onPress={step >= 3 ? finish : continueForm}
              >
                <Text style={styles.primaryText}>
                  {busy
                    ? 'Submitting…'
                    : step === 3
                    ? accountCreated
                      ? 'Continue'
                      : 'Submit'
                    : step === 7
                    ? photo
                      ? 'Finish registration'
                      : 'Skip photo & finish'
                    : step > 3
                    ? 'Save & continue'
                    : 'Continue'}
                </Text>
              </TouchableOpacity>
            ) : null}
            {step > 1 ? (
              <TouchableOpacity
                disabled={busy}
                accessibilityRole="button"
                style={styles.secondary}
                onPress={() => moveTo(step - 1)}
              >
                <Text style={styles.link}>Back</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              disabled={busy}
              accessibilityRole="button"
              style={styles.secondary}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.link}>Already have an account? Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  brand: { fontSize: 30, fontWeight: '800', color: colors.primary },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
  },
  title: { fontSize: 25, fontWeight: '800', color: colors.text },
  step: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
    marginVertical: 12,
  },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  chosen: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  field: { marginTop: 16 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  invalid: { borderColor: '#B42318' },
  error: { color: '#B42318', fontSize: 14, marginTop: 8 },
  primary: {
    minHeight: 52,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  primaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondary: { paddingVertical: 14, minHeight: 48, alignItems: 'center' },
  link: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
    paddingVertical: 8,
  },
  photo: { width: '100%', height: 240, borderRadius: 12 },
  terms: { marginTop: 20 },
  agreement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { backgroundColor: colors.primary },
  checkmark: { color: colors.white, fontSize: 18, fontWeight: '700' },
  agreementText: { flex: 1, color: colors.text, fontSize: 15 },
  status: { alignItems: 'center', marginTop: 16 },
  profileId: { fontSize: 20, color: colors.primary, fontWeight: '700' },
});
