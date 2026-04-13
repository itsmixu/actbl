import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppContext } from '../context/AppContext';
import { palette, typography } from '../theme/claudeTheme';

export function ProfileScreen() {
  const {
    currentUser,
    signOut,
    deleteAccount,
    dailyReminderEnabled,
    setDailyReminderEnabled,
    darkModeEnabled,
    setDarkModeEnabled,
  } = useAppContext();

  const [settingsFeedback, setSettingsFeedback] = useState('');
  const styles = useMemo(() => createStyles(darkModeEnabled), [darkModeEnabled]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, styles.heroCard]}>
          <Text style={[styles.kicker, styles.heroKicker]}>SETTINGS</Text>
          <Text style={[styles.sectionTitle, styles.heroTitle]}>Settings</Text>
          <Text style={[styles.meta, styles.heroMeta]}>Only the essentials</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.subHeading}>Profile</Text>
          <Text style={styles.name}>{currentUser?.name ?? 'Unknown user'}</Text>
          <Text style={styles.email}>{currentUser?.email ?? 'No email'}</Text>
          <Text style={styles.meta}>Friend code: {currentUser?.friendCode ?? '------'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.subHeading}>App Preferences</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingTitle}>Daily reminder</Text>
              <Text style={styles.settingDescription}>Receive a daily nudge to finish ongoing tasks.</Text>
            </View>
            <Switch
              value={dailyReminderEnabled}
              onValueChange={async (enabled) => {
                const actionResult = await setDailyReminderEnabled(enabled);
                setSettingsFeedback(actionResult.message);
              }}
              thumbColor={dailyReminderEnabled ? palette.ivory : palette.white}
              trackColor={{ false: palette.borderWarm, true: palette.terracotta }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingTitle}>Dark mode</Text>
              <Text style={styles.settingDescription}>Switch to a darker app appearance.</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={async (enabled) => {
                const actionResult = await setDarkModeEnabled(enabled);
                setSettingsFeedback(actionResult.message);
              }}
              thumbColor={darkModeEnabled ? palette.ivory : palette.white}
              trackColor={{ false: palette.borderWarm, true: palette.terracotta }}
            />
          </View>

          {settingsFeedback ? <Text style={styles.meta}>{settingsFeedback}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.subHeading}>Danger Zone</Text>
          <Text style={styles.settingDescription}>
            Delete your account and all related data permanently.
          </Text>
          <Pressable
            style={styles.deleteAccountButton}
            onPress={() => {
              Alert.alert(
                'Delete account?',
                'This permanently removes your account and data. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete account',
                    style: 'destructive',
                    onPress: () => {
                      void (async () => {
                        const actionResult = await deleteAccount();
                        setSettingsFeedback(actionResult.message);
                      })();
                    },
                  },
                ],
              );
            }}
          >
            <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
          </Pressable>
        </View>

        <Pressable style={styles.signOutButton} onPress={() => void signOut()}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(darkModeEnabled: boolean) {
  const surface = darkModeEnabled ? '#111315' : palette.parchment;
  const card = darkModeEnabled ? '#1a1d20' : palette.white;
  const cardBorder = darkModeEnabled ? '#2b2f35' : '#dfd7c8';
  const primaryText = darkModeEnabled ? '#f2f2f2' : palette.nearBlack;
  const secondaryText = darkModeEnabled ? '#b3bac3' : palette.oliveGray;
  const mutedText = darkModeEnabled ? '#8f97a3' : palette.stoneGray;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: surface,
    },
  content: {
    padding: 16,
    paddingTop: 22,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: card,
    borderWidth: 1,
    borderColor: cardBorder,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
  },
  heroCard: {
    backgroundColor: palette.nearBlack,
    borderColor: palette.darkSurface,
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
  },
  kicker: {
    fontFamily: typography.sans,
    fontSize: 11,
    letterSpacing: 0.5,
    color: palette.stoneGray,
  },
  sectionTitle: {
    fontFamily: typography.serif,
    fontSize: 32,
    color: palette.nearBlack,
    lineHeight: 38,
  },
  heroKicker: {
    color: palette.warmSilver,
  },
  heroTitle: {
    color: palette.ivory,
  },
  heroMeta: {
    color: palette.warmSilver,
  },
  subHeading: {
    fontFamily: typography.serif,
    fontSize: 24,
    color: primaryText,
    lineHeight: 30,
  },
  name: {
    fontFamily: typography.serif,
    fontSize: 29,
    color: primaryText,
  },
  email: {
    color: secondaryText,
    fontFamily: typography.sans,
    fontSize: 15,
  },
  meta: {
    color: secondaryText,
    fontSize: 15,
    fontFamily: typography.sans,
    lineHeight: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  settingTextWrap: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    fontFamily: typography.sans,
    color: primaryText,
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontFamily: typography.sans,
    color: mutedText,
    fontSize: 13,
    lineHeight: 20,
  },
  deleteAccountButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkModeEnabled ? '#5a3a3a' : '#e0ccc6',
    backgroundColor: card,
    alignItems: 'center',
    paddingVertical: 11,
    marginTop: 6,
  },
  deleteAccountButtonText: {
    color: palette.errorCrimson,
    fontWeight: '600',
    fontFamily: typography.sans,
  },
  signOutButton: {
    backgroundColor: palette.darkSurface,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: palette.darkSurface,
  },
  signOutButtonText: {
    color: palette.warmSilver,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: typography.sans,
  },
  });
}
