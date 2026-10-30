import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';

import {loginMember, getAuthError} from '../../api/authApi';
import {useAuth} from '../../context/AuthContext';

import colors from '../../theme/colors';


export default function LoginScreen({navigation}) {
  const {width} = useWindowDimensions();
  const heroImageWidth = Math.max(1, width - 52);
  const {signIn, accessError} = useAuth();

  const [loginMode, setLoginMode] = useState('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPasswordMode = loginMode === 'password';

  const handleLogin = async () => {
    if (loading) {
      return;
    }

    const value = identifier.trim();

    if (!value) {
      Alert.alert(
        'Required',
        'Enter your Profile ID, mobile number or email.',
      );
      return;
    }

    if (loginMode === 'otp') {
      Alert.alert(
        'Coming Next',
        'OTP login will be integrated next.',
      );
      return;
    }

    if (!password) {
      Alert.alert(
        'Required',
        'Enter your password.',
      );
      return;
    }

    try {
      setLoading(true);

      // Authenticate using Laravel API.
      const result = await loginMember(value, password);

      // AuthContext verifies the token, saves the session,
      // and updates authenticated navigation.
      await signIn(result.token, result.member);

      // AppNavigator automatically switches to Home.
      // No navigation.navigate('Home') is required.

    } catch (error) {
      console.log('=== LOGIN ERROR ===');
      console.log('Message:', error.message);
      console.log('Code:', error.code);
      console.log('Status:', error.response?.status);
      console.log('Response:', error.response?.data);

      Alert.alert(
        'Login Failed',
        getAuthError(error),
      );

    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">

        {/* Branding */}
        <View style={styles.hero}>
          <Text style={styles.brand}>
            Him<Text style={styles.brandAccent}>Shaadi</Text>
          </Text>

          <Text style={styles.brandSubtitle}>
            Himachali Matrimonial · Adults 18+
          </Text>
          {accessError ? (
            <Text accessibilityRole="alert" style={styles.accessError}>{accessError}</Text>
          ) : null}

          <Image
            source={require('../../assets/images/login-couple.png')}
            style={[
              styles.heroImage,
              {width: heroImageWidth, height: heroImageWidth / 1.5},
            ]}
            resizeMode="cover"
            accessible={false}
          />

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              Find Your{'\n'}
              <Text style={styles.brandAccent}>
                Perfect Match
              </Text>
            </Text>

            <Text style={styles.heroDescription}>
              Meaningful connections from the hills.
            </Text>
          </View>
        </View>

        {/* Login Card */}
        <View style={styles.loginCard}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tab,
                isPasswordMode && styles.activeTab,
              ]}
              onPress={() => setLoginMode('password')}>
              <Text
                style={[
                  styles.tabText,
                  isPasswordMode && styles.activeTabText,
                ]}>
                Password Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                !isPasswordMode && styles.activeTab,
              ]}
              onPress={() => setLoginMode('otp')}>
              <Text
                style={[
                  styles.tabText,
                  !isPasswordMode && styles.activeTabText,
                ]}>
                Login with OTP
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.heading}>
            Welcome Back
          </Text>

          <Text style={styles.description}>
            Sign in to discover meaningful matches.
          </Text>

          <Text style={styles.label}>
            Profile ID, Mobile Number or Email
          </Text>

          <TextInput
            style={styles.input}
            placeholder="HIM12345 / Mobile / Email"
            placeholderTextColor="#9A9CAD"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
          />

          {isPasswordMode && (
            <>
              <Text style={styles.label}>
                Password
              </Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#9A9CAD"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowPassword(!showPassword)
                  }>
                  <Text style={styles.showText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>
                {isPasswordMode
                  ? 'Login'
                  : 'Continue with OTP'}  →
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.securityText}>
            Secure & Private • Meaningful Connections
          </Text>

          <View style={styles.registerRow}>
            <Text style={styles.registerLabel}>
              New to HimShaadi?{' '}
            </Text>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Register')
              }>
              <Text style={styles.registerLink}>
                Register Free
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.informationLinks}>
          {[
            ['about', 'About'],
            ['privacy', 'Privacy Policy'],
            ['terms', 'Terms of Use'],
            ['childSafety', 'Child Safety Standards'],
          ].map(([page, title]) => (
            <TouchableOpacity key={page} accessibilityRole="button" style={styles.informationLink} onPress={() => navigation.navigate('Information', {page})}>
              <Text style={styles.registerLink}>{title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.footer}>
          A beautiful beginning awaits you.
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  informationLinks: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 20},
  informationLink: {minHeight: 48, paddingHorizontal: 10, justifyContent: 'center'},
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  hero: {
    backgroundColor: '#EDE9FF',
    paddingHorizontal: 26,
    paddingTop: 42,
    paddingBottom: 44,
  },
  brand: {
    fontSize: 35,
    fontWeight: '800',
    color: colors.text,
  },
  brandAccent: {
    color: colors.primary,
  },
  accessError: {color: colors.error, fontSize: 15, lineHeight: 23, marginTop: 16},
  brandSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 3,
  },
  heroContent: {
    marginTop: 20,
  },
  heroImage: {
    borderRadius: 20,
    marginTop: 22,
  },
  heroTitle: {
    fontSize: 31,
    fontWeight: '800',
    lineHeight: 38,
    color: colors.title,
  },
  heroDescription: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 12,
  },
  loginCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: -24,
    padding: 22,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#1B164A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 26,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.title,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 28,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 9,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    height: 54,
    paddingHorizontal: 15,
    color: colors.text,
    fontSize: 15,
    marginBottom: 22,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    height: 54,
    paddingHorizontal: 15,
    marginBottom: 24,
  },
  passwordInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  showText: {
    color: colors.primary,
    fontWeight: '700',
  },
  loginButton: {
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  securityText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 22,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 26,
  },
  registerLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  registerLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    marginTop: 30,
    color: colors.textSecondary,
    fontSize: 12,
  },
});
