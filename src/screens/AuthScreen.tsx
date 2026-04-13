import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAppContext } from '../context/AppContext';
import { palette, typography } from '../theme/claudeTheme';

type AuthMode = 'signin' | 'signup';

export function AuthScreen() {
  const { signIn, signUp } = useAppContext();

  const [mode, setMode] = useState<AuthMode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState('');

  const title = useMemo(
    () => (mode === 'signup' ? 'Create Account' : 'Sign In'),
    [mode],
  );

  async function submit() {
    const authResult =
      mode === 'signup'
        ? await signUp({ name, email, password })
        : await signIn({ email, password });

    setFeedback(authResult.message);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.appLabel}>ACTBL</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.bodyText}>Accountability, shared weekly goals, and consistent progress.</Text>

        {mode === 'signup' ? (
          <TextInput
            style={styles.input}
            value={name}
            placeholder="Name"
            onChangeText={setName}
            autoCapitalize="words"
          />
        ) : null}

        <TextInput
          style={styles.input}
          value={email}
          placeholder="Email"
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          value={password}
          placeholder="Password"
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <Pressable style={styles.primaryButton} onPress={() => void submit()}>
          <Text style={styles.primaryButtonText}>
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setMode((prev) => (prev === 'signup' ? 'signin' : 'signup'));
            setFeedback('');
          }}
        >
          <Text style={styles.secondaryText}>
            {mode === 'signup'
              ? 'Already have an account? Sign in.'
              : "Need an account? Create one."}
          </Text>
        </Pressable>

        {feedback ? (
          <Text style={styles.feedbackText}>{feedback}</Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.parchment,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: palette.ivory,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.borderCream,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
  },
  appLabel: {
    fontFamily: typography.sans,
    fontSize: 11,
    color: palette.stoneGray,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 34,
    color: palette.nearBlack,
    lineHeight: 39,
    marginBottom: 2,
  },
  bodyText: {
    fontFamily: typography.sans,
    color: palette.oliveGray,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.borderWarm,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    backgroundColor: palette.white,
    color: palette.nearBlack,
    fontFamily: typography.sans,
  },
  primaryButton: {
    backgroundColor: palette.terracotta,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  primaryButtonText: {
    color: palette.ivory,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.sans,
  },
  secondaryText: {
    color: palette.charcoalWarm,
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
    fontFamily: typography.sans,
  },
  feedbackText: {
    color: palette.charcoalWarm,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: typography.sans,
  },
});
