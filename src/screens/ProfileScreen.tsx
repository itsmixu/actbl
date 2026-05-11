import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedDialog } from '../components/ThemedDialog';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getThemeColors, palette, radius, space, text } from '../theme/theme';

const SHARE_URL = 'https://github.com/itsmixu/actbl';

type DialogState =
  | { kind: 'none' }
  | { kind: 'placeholder'; name: string }
  | { kind: 'about' }
  | { kind: 'confirmReset' }
  | { kind: 'confirmSignOut' }
  | { kind: 'reminderTime' };

function formatTime12h(hour: number, minute: number): string {
  const h12 = ((hour + 11) % 12) + 1;
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${h12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function ProfileScreen() {
  const {
    currentUser,
    currentWeekTasks,
    dailyReminderEnabled,
    dailyReminderHour,
    dailyReminderMinute,
    darkModeEnabled,
    setDailyReminderEnabled,
    setDailyReminderTime,
    setDarkModeEnabled,
    resetLocalData,
  } = useAppContext();
  const { user, signOut } = useAuth();

  const c = getThemeColors(darkModeEnabled);
  const styles = useMemo(() => createStyles(c), [c]);

  const [shareCopied, setShareCopied] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [dialog, setDialog] = useState<DialogState>({ kind: 'none' });
  const closeDialog = () => setDialog({ kind: 'none' });

  const completionPct = useMemo(() => {
    if (currentWeekTasks.length === 0) return 0;
    const done = currentWeekTasks.filter((t) => t.completed).length;
    return Math.round((done / currentWeekTasks.length) * 100);
  }, [currentWeekTasks]);

  const emailHandle = user?.email?.split('@')[0];
  const handle = emailHandle ?? currentUser?.email?.split('@')[0] ?? 'you';
  const initial = currentUser?.name?.charAt(0).toUpperCase() ?? '?';
  const version = Constants.expoConfig?.version ?? '1.0.0';

  async function handleToggleReminder(next: boolean) {
    const r = await setDailyReminderEnabled(next);
    if (!r.ok) {
      setFeedback(r.message);
    } else {
      setFeedback('');
    }
  }

  async function handleShareCopy() {
    await Clipboard.setStringAsync(SHARE_URL);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 1800);
  }

  function handleAbout() {
    setDialog({ kind: 'about' });
  }

  function handleResetData() {
    setDialog({ kind: 'confirmReset' });
  }

  async function confirmReset() {
    const r = await resetLocalData();
    setFeedback(r.message);
    closeDialog();
  }

  function handleSignOut() {
    setDialog({ kind: 'confirmSignOut' });
  }

  async function confirmSignOut() {
    closeDialog();
    // Clear local prototype data so the next signed-in user starts clean,
    // then sign out of Supabase. The navigator will route to SignInScreen.
    await resetLocalData();
    await signOut();
  }

  function handlePlaceholder(name: string) {
    setDialog({ kind: 'placeholder', name });
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </View>
          <Text style={styles.name}>{currentUser?.name ?? 'You'}</Text>
          <Text style={styles.handle}>@{handle}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{completionPct}%</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.statTile,
                styles.editTile,
                pressed && styles.editTilePressed,
              ]}
              accessibilityLabel="Edit profile"
              onPress={() => handlePlaceholder('Edit Profile')}
            >
              <Ionicons name="create-outline" size={18} color={c.brand} />
              <Text style={styles.editTileLabel}>Edit Profile</Text>
            </Pressable>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.settingsList}>
          <SettingRow
            label="Account Details"
            onPress={() => handlePlaceholder('Account Details')}
            c={c}
            styles={styles}
          />

          {/* Daily Reminder — label + time pill + switch */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, styles.settingLabelFlex]}>
              Daily Reminder
            </Text>
            <Pressable
              onPress={() => setDialog({ kind: 'reminderTime' })}
              style={({ pressed }) => [
                styles.timePill,
                pressed && styles.timePillPressed,
              ]}
              accessibilityLabel="Change daily reminder time"
            >
              <Text style={styles.timePillText}>
                {formatTime12h(dailyReminderHour, dailyReminderMinute)}
              </Text>
            </Pressable>
            <Switch
              value={dailyReminderEnabled}
              onValueChange={(v) => {
                void handleToggleReminder(v);
              }}
              trackColor={{ false: palette.warmSand, true: palette.terracotta }}
              thumbColor={palette.ivory}
            />
          </View>

          {/* Dark mode toggle */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, styles.settingLabelFlex]}>
              Dark Mode
            </Text>
            <Switch
              value={darkModeEnabled}
              onValueChange={(v) => {
                void setDarkModeEnabled(v);
              }}
              trackColor={{ false: palette.warmSand, true: palette.terracotta }}
              thumbColor={palette.ivory}
            />
          </View>

          <SettingRow
            label="Notifications"
            onPress={() => handlePlaceholder('Notifications')}
            c={c}
            styles={styles}
          />

          {/* Share — copies to clipboard (keeps transient feedback) */}
          <SettingRow
            label="Share actbl"
            description={shareCopied ? 'Link copied!' : undefined}
            descriptionAccent={shareCopied}
            rightIcon={shareCopied ? 'checkmark' : 'copy-outline'}
            onPress={() => {
              void handleShareCopy();
            }}
            c={c}
            styles={styles}
          />

          <SettingRow
            label="About"
            onPress={handleAbout}
            c={c}
            styles={styles}
          />
          <SettingRow
            label="Reset local data"
            onPress={handleResetData}
            c={c}
            styles={styles}
          />
        </View>

        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

        {/* Auth actions */}
        <View style={styles.authActions}>
          <Pressable
            style={({ pressed }) => [
              styles.dangerButton,
              pressed && styles.dangerButtonPressed,
            ]}
            onPress={handleSignOut}
          >
            <Text style={styles.dangerText}>Sign Out</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.dangerButton,
              styles.dangerButtonMuted,
              pressed && styles.dangerButtonPressed,
            ]}
            onPress={() => handlePlaceholder('Delete Account')}
          >
            <Text style={styles.dangerText}>Delete Account</Text>
          </Pressable>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Themed dialogs */}
      <ThemedDialog
        visible={dialog.kind === 'placeholder'}
        title={dialog.kind === 'placeholder' ? dialog.name : ''}
        message="Coming soon."
        actions={[{ label: 'OK', variant: 'primary', onPress: closeDialog }]}
        onRequestClose={closeDialog}
      />
      <ThemedDialog
        visible={dialog.kind === 'about'}
        title="About actbl"
        message={`Version ${version}\n\nA focused weekly accountability tool.\n\n${SHARE_URL}`}
        actions={[{ label: 'Close', variant: 'primary', onPress: closeDialog }]}
        onRequestClose={closeDialog}
      />
      <ThemedDialog
        visible={dialog.kind === 'confirmReset'}
        title="Reset all local data?"
        message="This will permanently delete your tasks, friends, pokes, and check-ins. This can't be undone."
        actions={[
          { label: 'Cancel', variant: 'secondary', onPress: closeDialog },
          {
            label: 'Reset',
            variant: 'destructive',
            onPress: () => {
              void confirmReset();
            },
          },
        ]}
        onRequestClose={closeDialog}
      />
      <ThemedDialog
        visible={dialog.kind === 'confirmSignOut'}
        title="Sign out?"
        message="You'll be signed out on this device. Your data is safe and will be there when you sign back in."
        actions={[
          { label: 'Cancel', variant: 'secondary', onPress: closeDialog },
          {
            label: 'Sign out',
            variant: 'destructive',
            onPress: () => {
              void confirmSignOut();
            },
          },
        ]}
        onRequestClose={closeDialog}
      />
      <ReminderTimePickerDialog
        visible={dialog.kind === 'reminderTime'}
        initialHour={dailyReminderHour}
        initialMinute={dailyReminderMinute}
        onCancel={closeDialog}
        onSave={async (h, m) => {
          const r = await setDailyReminderTime(h, m);
          setFeedback(r.message);
          closeDialog();
        }}
      />
    </SafeAreaView>
  );
}

function ReminderTimePickerDialog({
  visible,
  initialHour,
  initialMinute,
  onCancel,
  onSave,
}: {
  visible: boolean;
  initialHour: number;
  initialMinute: number;
  onCancel: () => void;
  onSave: (hour: number, minute: number) => void | Promise<void>;
}) {
  const { darkModeEnabled } = useAppContext();
  const c = getThemeColors(darkModeEnabled);
  const styles = useMemo(() => createPickerStyles(c), [c]);

  const [hour24, setHour24] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);

  // Re-seed local state whenever the dialog opens.
  useEffect(() => {
    if (visible) {
      setHour24(initialHour);
      setMinute(initialMinute);
    }
  }, [visible, initialHour, initialMinute]);

  const isPm = hour24 >= 12;
  const hour12 = ((hour24 + 11) % 12) + 1;

  function setHour12(next12: number) {
    const wrapped = ((next12 - 1 + 12) % 12) + 1; // 1..12
    const next24 = (wrapped % 12) + (isPm ? 12 : 0);
    setHour24(next24);
  }

  function setAmPm(nextIsPm: boolean) {
    if (nextIsPm === isPm) return;
    setHour24((prev) => (nextIsPm ? prev + 12 : prev - 12));
  }

  function bumpHour(delta: number) {
    setHour12(hour12 + delta);
  }

  function bumpMinute(delta: number) {
    setMinute((prev) => {
      const next = prev + delta;
      return ((next % 60) + 60) % 60;
    });
  }

  function handleHourInput(raw: string) {
    if (raw === '') {
      setHour12(12);
      return;
    }
    const parsed = Number(raw.replace(/\D/g, ''));
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.max(1, Math.min(12, parsed));
    setHour12(clamped);
  }

  function handleMinuteInput(raw: string) {
    if (raw === '') {
      setMinute(0);
      return;
    }
    const parsed = Number(raw.replace(/\D/g, ''));
    if (!Number.isFinite(parsed)) return;
    setMinute(Math.max(0, Math.min(59, parsed)));
  }

  return (
    <ThemedDialog
      visible={visible}
      title="Reminder time"
      message="When should we remind you each day?"
      onRequestClose={onCancel}
      actions={[
        { label: 'Cancel', variant: 'secondary', onPress: onCancel },
        {
          label: 'Save',
          variant: 'primary',
          onPress: () => {
            void onSave(hour24, minute);
          },
        },
      ]}
    >
      <View style={styles.pickerRow}>
        <View style={styles.pickerColumn}>
          <Pressable
            onPress={() => bumpHour(1)}
            style={({ pressed }) => [
              styles.bumpButton,
              pressed && styles.bumpButtonPressed,
            ]}
            accessibilityLabel="Increase hour"
          >
            <Ionicons name="chevron-up" size={20} color={c.textSecondary} />
          </Pressable>
          <TextInput
            value={String(hour12)}
            onChangeText={handleHourInput}
            keyboardType="number-pad"
            maxLength={2}
            style={styles.pickerInput}
            selectTextOnFocus
          />
          <Pressable
            onPress={() => bumpHour(-1)}
            style={({ pressed }) => [
              styles.bumpButton,
              pressed && styles.bumpButtonPressed,
            ]}
            accessibilityLabel="Decrease hour"
          >
            <Ionicons name="chevron-down" size={20} color={c.textSecondary} />
          </Pressable>
        </View>

        <Text style={styles.pickerSeparator}>:</Text>

        <View style={styles.pickerColumn}>
          <Pressable
            onPress={() => bumpMinute(5)}
            style={({ pressed }) => [
              styles.bumpButton,
              pressed && styles.bumpButtonPressed,
            ]}
            accessibilityLabel="Increase minute"
          >
            <Ionicons name="chevron-up" size={20} color={c.textSecondary} />
          </Pressable>
          <TextInput
            value={String(minute).padStart(2, '0')}
            onChangeText={handleMinuteInput}
            keyboardType="number-pad"
            maxLength={2}
            style={styles.pickerInput}
            selectTextOnFocus
          />
          <Pressable
            onPress={() => bumpMinute(-5)}
            style={({ pressed }) => [
              styles.bumpButton,
              pressed && styles.bumpButtonPressed,
            ]}
            accessibilityLabel="Decrease minute"
          >
            <Ionicons name="chevron-down" size={20} color={c.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.ampmColumn}>
          <Pressable
            onPress={() => setAmPm(false)}
            style={[
              styles.ampmButton,
              !isPm && styles.ampmButtonActive,
            ]}
          >
            <Text
              style={[
                styles.ampmText,
                !isPm && styles.ampmTextActive,
              ]}
            >
              AM
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setAmPm(true)}
            style={[
              styles.ampmButton,
              isPm && styles.ampmButtonActive,
            ]}
          >
            <Text
              style={[
                styles.ampmText,
                isPm && styles.ampmTextActive,
              ]}
            >
              PM
            </Text>
          </Pressable>
        </View>
      </View>
    </ThemedDialog>
  );
}

function createPickerStyles(c: ReturnType<typeof getThemeColors>) {
  return StyleSheet.create({
    pickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.md,
      paddingVertical: space.sm,
    },
    pickerColumn: {
      alignItems: 'center',
      gap: 4,
    },
    bumpButton: {
      width: 44,
      height: 32,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    bumpButtonPressed: {
      backgroundColor: c.surfaceActive,
    },
    pickerInput: {
      ...text.displayHero,
      fontSize: 32,
      lineHeight: 36,
      color: c.textPrimary,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      minWidth: 64,
      textAlign: 'center',
    },
    pickerSeparator: {
      ...text.displayHero,
      fontSize: 32,
      lineHeight: 36,
      color: c.textPrimary,
    },
    ampmColumn: {
      flexDirection: 'column',
      gap: 4,
      marginLeft: space.sm,
    },
    ampmButton: {
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      minWidth: 56,
      alignItems: 'center',
    },
    ampmButtonActive: {
      backgroundColor: c.brand,
      borderColor: c.brand,
    },
    ampmText: {
      ...text.label,
      color: c.textSecondary,
    },
    ampmTextActive: {
      color: c.brandText,
    },
  });
}

function SettingRow({
  label,
  description,
  descriptionAccent,
  rightIcon,
  onPress,
  c,
  styles,
}: {
  label: string;
  description?: string;
  descriptionAccent?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  c: ReturnType<typeof getThemeColors>;
  styles: ReturnType<typeof createStyles>;
}) {
  const iconName = rightIcon ?? 'chevron-forward';
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingRow,
        pressed && styles.settingRowPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.settingTextBlock}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description ? (
          <Text
            style={[
              styles.settingDescription,
              descriptionAccent && styles.settingDescriptionAccent,
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      <Ionicons
        name={iconName}
        size={20}
        color={descriptionAccent ? c.brand : c.textSecondary}
      />
    </Pressable>
  );
}

function createStyles(c: ReturnType<typeof getThemeColors>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollContent: {
      paddingHorizontal: space.xl,
      paddingTop: space.xl,
      paddingBottom: space.section,
    },
    profileCard: {
      backgroundColor: c.surface,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      padding: space.xl,
      alignItems: 'center',
      gap: space.sm,
    },
    avatarWrap: {
      padding: 4,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: c.border,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: c.surfaceActive,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      ...text.displayHero,
      fontSize: 40,
      lineHeight: 44,
      color: c.textPrimary,
    },
    name: {
      ...text.subHeading,
      color: c.textPrimary,
      marginTop: space.sm,
    },
    handle: {
      ...text.bodyStandard,
      color: c.textSecondary,
    },
    statsRow: {
      flexDirection: 'row',
      gap: space.md,
      marginTop: space.base,
      width: '100%',
    },
    statTile: {
      flex: 1,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.xl,
      paddingVertical: space.base,
      alignItems: 'center',
      gap: 2,
    },
    statValue: {
      ...text.featureTitle,
      color: c.brand,
    },
    statLabel: {
      ...text.caption,
      color: c.textSecondary,
    },
    editTile: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: space.sm,
    },
    editTilePressed: {
      backgroundColor: c.surfaceActive,
    },
    editTileLabel: {
      ...text.bodyUiBold,
      color: c.brand,
    },
    settingsList: {
      marginTop: space.xl,
      gap: space.md,
    },
    settingRow: {
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: space.sm,
      paddingHorizontal: space.lg,
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settingRowPressed: {
      backgroundColor: c.surfaceActive,
    },
    settingTextBlock: {
      flex: 1,
      gap: 2,
    },
    settingLabel: {
      ...text.bodyUiBold,
      color: c.textPrimary,
    },
    settingLabelFlex: {
      flex: 1,
    },
    timePill: {
      backgroundColor: c.brand,
      paddingHorizontal: space.md,
      paddingVertical: 6,
      borderRadius: radius.full,
      marginRight: space.sm,
    },
    timePillPressed: {
      opacity: 0.85,
    },
    timePillText: {
      ...text.bodyUiBold,
      color: c.brandText,
    },
    settingDescription: {
      ...text.caption,
      color: c.textSecondary,
    },
    settingDescriptionAccent: {
      color: c.brand,
    },
    feedback: {
      ...text.caption,
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: space.base,
    },
    authActions: {
      flexDirection: 'row',
      gap: space.md,
      marginTop: space.xl,
    },
    dangerButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.error,
      borderRadius: radius.pill,
      paddingVertical: space.base,
      alignItems: 'center',
    },
    dangerButtonMuted: {
      borderColor: c.error + '55',
    },
    dangerButtonPressed: {
      backgroundColor: c.error + '11',
    },
    dangerText: {
      ...text.bodyUiBold,
      color: c.error,
    },
    bottomSpacer: {
      height: space.section,
    },
  });
}
