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
import { useAuth } from '../context/AuthContext';
import { getThemeColors, radius, space, text } from '../theme/theme';

export function NameSetupScreen() {
  const { darkModeEnabled } = useAppContext();
  const { updateDisplayName, signOut } = useAuth();
  const c = getThemeColors(darkModeEnabled);
  const styles = useMemo(() => createStyles(c), [c]);

  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setError('');
    setIsSaving(true);
    const r = await updateDisplayName(name);
    setIsSaving(false);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    // On success, AuthContext.profile.name is now set and the navigator
    // will transition to the main app automatically.
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>What should friends call you?</Text>
            <Text style={styles.body}>
              This is the name your friends will see when you appear on their list, send a poke,
              or share a check-in.
            </Text>
            <TextInput
              value={name}
              onChangeText={(v) => {
                setName(v);
                setError('');
              }}
              placeholder="Your name"
              placeholderTextColor={c.textTertiary}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              maxLength={40}
              style={styles.input}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => {
                void handleSave();
              }}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Pressable
              onPress={() => {
                void handleSave();
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                (isSaving || !name.trim()) && styles.primaryButtonDisabled,
              ]}
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? (
                <ActivityIndicator color={c.brandText} />
              ) : (
                <Text style={styles.primaryButtonText}>Continue</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                void signOut();
              }}
              style={({ pressed }) => [styles.signOutLink, pressed && styles.signOutLinkPressed]}
            >
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
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
      justifyContent: 'center',
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      borderWidth: 1,
      borderColor: c.border,
      padding: space.xl,
      gap: space.md,
    },
    title: {
      ...text.subHeading,
      color: c.textPrimary,
    },
    body: {
      ...text.bodyStandard,
      color: c.textSecondary,
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
    errorText: {
      ...text.caption,
      color: c.error,
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
    signOutLink: {
      alignItems: 'center',
      paddingVertical: space.sm,
    },
    signOutLinkPressed: {
      opacity: 0.6,
    },
    signOutText: {
      ...text.caption,
      color: c.textSecondary,
    },
  });
}
