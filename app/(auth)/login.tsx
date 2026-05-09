import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLogin } from '@/hooks/useLogin';
import { ApiError } from '@/api/client';

const loginBackground = require('../../assets/login-background.png');
const veloryMark = require('../../assets/icon.png');

const DEFAULT_HOST = process.env.EXPO_PUBLIC_API_URL ?? 'https://dev.veloryn.pl';

export default function LoginScreen() {
  const { t } = useTranslation('common');

  const [host, setHost] = useState<string>(DEFAULT_HOST);
  const [login, setLogin] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync: submitLogin, isPending } = useLogin();

  function isHostValid(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return false;
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const url = new URL(withProtocol);
      return Boolean(url.hostname);
    } catch {
      return false;
    }
  }

  async function handleSubmit(): Promise<void> {
    setErrorMessage(null);

    if (!isHostValid(host)) {
      setErrorMessage(t('auth.login.errors.invalidHost'));
      return;
    }
    if (!login.trim()) {
      setErrorMessage(t('auth.login.errors.invalidLogin'));
      return;
    }
    if (!password) {
      setErrorMessage(t('auth.login.errors.passwordRequired'));
      return;
    }

    try {
      await submitLogin({ host, login, password });
      // Nawigacja do (tabs)/messenger jest w onSuccess hooka useLogin
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'MOBILE_LOGIN_INVALID_CREDENTIALS' || err.status === 401) {
          setErrorMessage(t('auth.login.errors.invalidCredentials'));
        } else if (err.code === 'MOBILE_LOGIN_INACTIVE_ACCOUNT' || err.status === 403) {
          setErrorMessage(t('auth.login.errors.inactiveAccount'));
        } else if (err.status === 404 || err.status === 405) {
          // Endpoint nie istnieje na tym backendzie — najczęściej oznacza ze prod ma
          // starsza wersje serwera niz wymaga apka mobilna (lub zly host wpisany).
          setErrorMessage(t('auth.login.errors.endpointUnavailable'));
        } else if (err.status === 429) {
          setErrorMessage(t('auth.login.errors.throttled'));
        } else if (err.status === 422) {
          setErrorMessage(err.message || t('auth.login.errors.validation'));
        } else if (err.status >= 500 && err.status < 600) {
          setErrorMessage(t('auth.login.errors.serverError'));
        } else if (err.status === 502 || err.status === 503 || err.status === 504) {
          setErrorMessage(t('auth.login.errors.backendUnavailable'));
        } else {
          setErrorMessage(err.message || t('auth.login.errors.serverError'));
        }
      } else if (err instanceof Error && /Network|timeout|ECONN/i.test(err.message)) {
        setErrorMessage(t('auth.login.errors.networkError'));
      } else {
        setErrorMessage(err instanceof Error ? err.message : t('common.error'));
      }
    }
  }

  function handleQrFallback(): void {
    router.push('/(auth)/pair');
  }

  return (
    <ImageBackground
      source={loginBackground}
      style={styles.gradient}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.brandHeader}>
              <Image source={veloryMark} style={styles.brandMark} resizeMode="contain" />
              <Text style={styles.brandTitle}>VELORYN</Text>
              <Text style={styles.brandSubtitle}>{t('auth.login.title')}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>{t('auth.login.hostLabel')}</Text>
              <TextInput
                value={host}
                onChangeText={setHost}
                placeholder={t('auth.login.hostPlaceholder')}
                placeholderTextColor="#9e9e9e"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                editable={!isPending}
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>{t('auth.login.loginLabel')}</Text>
              <TextInput
                value={login}
                onChangeText={setLogin}
                placeholder={t('auth.login.loginPlaceholder')}
                placeholderTextColor="#9e9e9e"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                textContentType="username"
                editable={!isPending}
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>{t('auth.login.passwordLabel')}</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  placeholderTextColor="#9e9e9e"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  editable={!isPending}
                  onSubmitEditing={handleSubmit}
                  returnKeyType="go"
                  style={[styles.input, styles.passwordInput]}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.eyeButton}
                  accessibilityRole="button"
                  accessibilityLabel={t(
                    showPassword ? 'auth.login.hidePassword' : 'auth.login.showPassword',
                  )}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              {errorMessage ? (
                <Text style={styles.errorText} accessibilityRole="alert">
                  {errorMessage}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryButton, isPending && styles.primaryButtonDisabled]}
                onPress={handleSubmit}
                disabled={isPending}
                accessibilityRole="button"
              >
                {isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>{t('auth.login.submit')}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('auth.login.orDivider')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleQrFallback}
                disabled={isPending}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>{t('auth.login.qrFallback')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandMark: {
    width: 96,
    height: 96,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 4,
    color: '#ffffff',
  },
  brandSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fieldLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 6,
    marginTop: 12,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.87)',
    backgroundColor: '#fafafa',
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: '#a54cc7',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: 'rgba(165, 76, 199, 0.6)',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#7a24a1',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#7a24a1',
    fontSize: 14,
    fontWeight: '600',
  },
});
