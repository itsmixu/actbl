import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { getThemeColors, radius, space, text } from '../theme/theme';

WebBrowser.maybeCompleteAuthSession();

type Stage = 'email' | 'otp';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function SignInScreen() {
  const { darkModeEnabled } = useAppContext();
  const c = getThemeColors(darkModeEnabled);
  const styles = useMemo(() => createStyles(c), [c]);

  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setError('');
    setIsGoogleLoading(true);
    const redirectTo = Linking.createURL('auth/callback');
    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });
    if (err || !data.url) {
      setError(err?.message ?? 'Could not start Google sign-in.');
      setIsGoogleLoading(false);
      return;
    }
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    setIsGoogleLoading(false);
    if (result.type === 'success') {
      const parsed = Linking.parse(result.url);
      const accessToken =
        typeof parsed.queryParams?.access_token === 'string'
          ? parsed.queryParams.access_token
          : null;
      const refreshToken =
        typeof parsed.queryParams?.refresh_token === 'string'
          ? parsed.queryParams.refresh_token
          : null;
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      } else {
        setError('Sign-in failed. Please try again.');
      }
    }
  }

  async function handleSendCode() {
    setError('');
    setInfo('');
    const clean = email.trim().toLowerCase();
    if (!isValidEmail(clean)) {
      setError('Enter a valid email address.');
      return;
    }
    setIsLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: clean,
      options: {
        shouldCreateUser: true,
      },
    });
    setIsLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setEmail(clean);
    setStage('otp');
    setInfo('Check your inbox for a 6-digit code.');
  }

  async function handleVerifyOtp() {
    setError('');
    setInfo('');
    const token = otp.replace(/\D/g, '').slice(0, 6);
    if (token.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setIsLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    setIsLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    // On success, AuthProvider picks up the new session via onAuthStateChange.
  }

  async function handleResend() {
    setError('');
    setInfo('');
    setIsLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    setIsLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setInfo('Sent again. Check your inbox.');
  }

  function handleBack() {
    setStage('email');
    setOtp('');
    setError('');
    setInfo('');
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.brand}>actbl.</Text>
            <Text style={styles.tagline}>Weekly accountability with people you trust.</Text>
          </View>

          {stage === 'email' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sign in</Text>
              <Text style={styles.cardBody}>
                Enter your email and we'll send you a 6-digit code. No password to remember.
              </Text>
              <TextInput
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setError('');
                }}
                placeholder="you@example.com"
                placeholderTextColor={c.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                style={styles.input}
                editable={!isLoading}
                returnKeyType="send"
                onSubmitEditing={() => {
                  void handleSendCode();
                }}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <Pressable
                onPress={() => {
                  void handleSendCode();
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                  isLoading && styles.primaryButtonDisabled,
                ]}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={c.brandText} />
                ) : (
                  <>
                    <Ionicons name="mail-outline" size={18} color={c.brandText} />
                    <Text style={styles.primaryButtonText}>Send code</Text>
                  </>
                )}
              </Pressable>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                onPress={() => {
                  void handleGoogleSignIn();
                }}
                style={({ pressed }) => [
                  styles.googleButton,
                  pressed && styles.googleButtonPressed,
                  isGoogleLoading && styles.primaryButtonDisabled,
                ]}
                disabled={isGoogleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator color={c.textPrimary} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={18} color={c.textPrimary} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.card}>
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [styles.backRow, pressed && styles.backRowPressed]}
                hitSlop={10}
              >
                <Ionicons name="chevron-back" size={18} color={c.textSecondary} />
                <Text style={styles.backText}>Use a different email</Text>
              </Pressable>

              <Text style={styles.cardTitle}>Check your email</Text>
              <Text style={styles.cardBody}>
                We sent a 6-digit code to{'\n'}
                <Text style={styles.emphasized}>{email}</Text>
              </Text>

              <TextInput
                value={otp}
                onChangeText={(v) => {
                  setOtp(v.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                placeholder="000000"
                placeholderTextColor={c.textTertiary}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.otpInput}
                editable={!isLoading}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => {
                  void handleVerifyOtp();
                }}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {info && !error ? <Text style={styles.infoText}>{info}</Text> : null}

              <Pressable
                onPress={() => {
                  void handleVerifyOtp();
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                  isLoading && styles.primaryButtonDisabled,
                ]}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={c.brandText} />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify code</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  void handleResend();
                }}
                disabled={isLoading}
                style={({ pressed }) => [styles.resendButton, pressed && styles.resendButtonPressed]}
              >
                <Text style={styles.resendText}>Resend email</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing you agree to use actbl responsibly with friends you trust.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(c: ReturnType<typeof getThemeColors>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    flex: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      padding: space.xl,
      gap: space.xl,
      justifyContent: 'center',
    },
    header: {
      alignItems: 'center',
      gap: space.sm,
      marginBottom: space.lg,
    },
    brand: {
      ...text.displayHero,
      color: c.brand,
    },
    tagline: {
      ...text.bodyLarge,
      color: c.textSecondary,
      textAlign: 'center',
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      borderWidth: 1,
      borderColor: c.border,
      padding: space.xl,
      gap: space.md,
    },
    cardTitle: {
      ...text.subHeading,
      color: c.textPrimary,
    },
    cardBody: {
      ...text.bodyStandard,
      color: c.textSecondary,
    },
    emphasized: {
      color: c.textPrimary,
      fontWeight: '600',
    },
    input: {
      ...text.bodyLarge,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: space.base,
      paddingVertical: space.md,
      color: c.textPrimary,
    },
    otpInput: {
      ...text.displayHero,
      fontSize: 32,
      lineHeight: 36,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: space.base,
      paddingVertical: space.md,
      color: c.textPrimary,
      letterSpacing: 8,
      textAlign: 'center',
    },
    errorText: {
      ...text.caption,
      color: c.error,
    },
    infoText: {
      ...text.caption,
      color: c.textSecondary,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.sm,
      backgroundColor: c.brand,
      borderRadius: radius.pill,
      paddingVertical: space.base,
      marginTop: space.sm,
    },
    primaryButtonPressed: {
      opacity: 0.9,
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      ...text.bodyUiBold,
      color: c.brandText,
    },
    resendButton: {
      alignItems: 'center',
      paddingVertical: space.sm,
    },
    resendButtonPressed: {
      opacity: 0.6,
    },
    resendText: {
      ...text.bodyUiBold,
      color: c.textSecondary,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: c.border,
    },
    dividerText: {
      ...text.caption,
      color: c.textTertiary,
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.sm,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.pill,
      paddingVertical: space.base,
    },
    googleButtonPressed: {
      opacity: 0.8,
    },
    googleButtonText: {
      ...text.bodyUiBold,
      color: c.textPrimary,
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: space.xs,
    },
    backRowPressed: {
      opacity: 0.6,
    },
    backText: {
      ...text.caption,
      color: c.textSecondary,
    },
    footer: {
      alignItems: 'center',
      paddingHorizontal: space.lg,
    },
    footerText: {
      ...text.caption,
      color: c.textTertiary,
      textAlign: 'center',
    },
  });
}
