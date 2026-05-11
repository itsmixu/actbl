import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppContext } from '../context/AppContext';
import { getThemeColors, palette, radius, space, text } from '../theme/theme';

const CONFETTI_COLORS = [
  palette.terracotta,
  palette.coral,
  palette.warmSand,
  palette.brandDark,
  palette.ivory,
];

function getGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Hello';
}

export function TasksScreen() {
  const {
    currentUser,
    friends,
    currentWeekTasks,
    darkModeEnabled,
    sendPoke,
    createTask,
    toggleTask,
  } = useAppContext();

  const c = getThemeColors(darkModeEnabled);
  const styles = useMemo(() => createStyles(c), [c]);

  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [feedback, setFeedback] = useState('');
  const [confettiBurst, setConfettiBurst] = useState(0);
  const previousCompletedRef = useRef<Record<string, boolean>>({});

  // Sort: incomplete first, then completed — both newest-first within their group.
  const sortedTasks = useMemo(() => {
    return [...currentWeekTasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [currentWeekTasks]);

  function handleToggleTask(taskId: string) {
    const task = currentWeekTasks.find((t) => t.id === taskId);
    const wasCompleted = previousCompletedRef.current[taskId] ?? task?.completed ?? false;
    void toggleTask(taskId).then(() => {
      // Trigger confetti when transitioning incomplete → complete.
      if (!wasCompleted) {
        setConfettiBurst((n) => n + 1);
      }
      previousCompletedRef.current[taskId] = !wasCompleted;
    });
  }

  const greeting = useMemo(() => getGreeting(), []);
  const firstName = (currentUser?.name ?? 'there').split(' ')[0];

  async function handleAddTask() {
    const title = newTaskTitle.trim();
    if (!title) {
      setIsAdding(false);
      return;
    }
    const r = await createTask(title);
    if (r.ok) {
      setNewTaskTitle('');
      setIsAdding(false);
      setFeedback('');
    } else {
      setFeedback(r.message);
    }
  }

  async function handlePoke(friendId: string) {
    const r = await sendPoke(friendId);
    setFeedback(r.message);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Sticky top app bar */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>actbl.</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={64}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Greeting */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingHeading}>
            {greeting},{'\n'}
            {firstName}.
          </Text>
          <Text style={styles.greetingSubtitle}>Let's make this week count.</Text>
        </View>

        {/* Your Tasks */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Your Tasks</Text>
          <View style={styles.sectionDivider} />

          <View style={styles.taskList}>
            {currentWeekTasks.length === 0 && !isAdding && (
              <Text style={styles.emptyText}>
                No tasks yet. Tap the + to add your first commitment.
              </Text>
            )}

            {sortedTasks.map((task) => (
              <Pressable
                key={task.id}
                onPress={() => handleToggleTask(task.id)}
                style={({ pressed }) => [
                  styles.taskCard,
                  task.completed && styles.taskCardDone,
                  pressed && styles.taskCardPressed,
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    task.completed && styles.checkboxChecked,
                  ]}
                >
                  {task.completed && (
                    <Ionicons name="checkmark" size={16} color={c.brandText} />
                  )}
                </View>
                <View style={styles.taskBody}>
                  <Text
                    style={[
                      styles.taskTitle,
                      task.completed && styles.taskTitleDone,
                    ]}
                  >
                    {task.title}
                  </Text>
                </View>
              </Pressable>
            ))}

            {isAdding && (
              <View style={styles.addCard}>
                <TextInput
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  placeholder="What are you committing to?"
                  placeholderTextColor={c.textTertiary}
                  style={styles.addInput}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleAddTask}
                />
                <View style={styles.addActions}>
                  <Pressable
                    onPress={() => {
                      setNewTaskTitle('');
                      setIsAdding(false);
                    }}
                    style={styles.addSecondaryButton}
                  >
                    <Text style={styles.addSecondaryText}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={handleAddTask} style={styles.addPrimaryButton}>
                    <Text style={styles.addPrimaryText}>Add</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Floating + button */}
          {!isAdding && (
            <View style={styles.fabRow}>
              <Pressable
                onPress={() => setIsAdding(true)}
                style={({ pressed }) => [
                  styles.fab,
                  pressed && styles.fabPressed,
                ]}
                hitSlop={10}
                accessibilityLabel="Add task"
              >
                <Ionicons name="add" size={28} color={c.brandText} />
              </Pressable>
            </View>
          )}
        </View>

        {/* Friend's Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Friend's Progress</Text>
          <View style={styles.sectionDivider} />

          <View style={styles.friendList}>
            {friends.length === 0 && (
              <Text style={styles.emptyText}>
                Add a friend to share weekly commitments.
              </Text>
            )}

            {friends.map((friend) => {
              const initial = friend.name?.charAt(0).toUpperCase() ?? '?';
              return (
                <View key={friend.id} style={styles.friendCard}>
                  <View style={styles.friendHeader}>
                    <View style={styles.friendIdentity}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initial}</Text>
                      </View>
                      <View style={styles.friendNameBlock}>
                        <Text style={styles.friendName}>{friend.name}</Text>
                        <Text style={styles.friendSubtitle}>
                          Working on this week
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => {
                        void handlePoke(friend.id);
                      }}
                      style={({ pressed }) => [
                        styles.pokeButton,
                        pressed && styles.pokeButtonPressed,
                      ]}
                    >
                      <Ionicons
                        name="notifications"
                        size={14}
                        color={c.brandText}
                      />
                      <Text style={styles.pokeButtonText}>Poke</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Confetti overlay — re-mounted on each burst via the key */}
      {confettiBurst > 0 && (
        <View pointerEvents="none" style={styles.confettiLayer}>
          <ConfettiCannon
            key={confettiBurst}
            count={60}
            origin={{ x: Dimensions.get('window').width / 2, y: -20 }}
            fadeOut
            fallSpeed={3500}
            explosionSpeed={280}
            colors={CONFETTI_COLORS}
          />
        </View>
      )}
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
    appBar: {
      backgroundColor: c.background,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      paddingVertical: space.base,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appBarTitle: {
      ...text.subHeadingLg,
      fontSize: 24,
      lineHeight: 28,
      color: c.brand,
    },
    scrollContent: {
      paddingHorizontal: space.xl,
      paddingTop: space.section,
      paddingBottom: space.sectionLg,
    },
    greetingBlock: {
      alignItems: 'center',
      marginBottom: space.section,
    },
    greetingHeading: {
      ...text.displayHero,
      color: c.textPrimary,
      textAlign: 'center',
      marginBottom: space.md,
    },
    greetingSubtitle: {
      ...text.bodyLarge,
      color: c.textSecondary,
      textAlign: 'center',
    },
    section: {
      marginBottom: space.section,
    },
    sectionHeading: {
      ...text.subHeading,
      color: c.textPrimary,
      textAlign: 'center',
      paddingBottom: space.md,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: c.border,
      marginBottom: space.xl,
    },
    taskList: {
      gap: space.md,
    },
    emptyText: {
      ...text.bodyStandard,
      color: c.textTertiary,
      textAlign: 'center',
      paddingVertical: space.lg,
    },
    taskCard: {
      backgroundColor: c.surface,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: space.lg,
      paddingHorizontal: space.xl,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.base,
      position: 'relative',
      overflow: 'hidden',
    },
    taskCardDone: {
      // visual stays the same; the accent + line-through carry the state
    },
    taskCardPressed: {
      backgroundColor: c.surfaceRaised,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: c.textTertiary,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceRaised,
    },
    checkboxChecked: {
      borderColor: c.brand,
      backgroundColor: c.brand,
    },
    taskBody: {
      flex: 1,
      gap: 4,
    },
    taskTitle: {
      ...text.featureTitle,
      color: c.textPrimary,
    },
    taskTitleDone: {
      textDecorationLine: 'line-through',
      opacity: 0.55,
    },
    fabRow: {
      alignItems: 'center',
      marginTop: space.xl,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    fabPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },
    addCard: {
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      borderWidth: 1,
      borderColor: c.border,
      padding: space.xl,
      gap: space.md,
    },
    addInput: {
      ...text.bodyStandard,
      color: c.textPrimary,
      paddingVertical: space.sm,
    },
    addActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: space.sm,
    },
    addPrimaryButton: {
      backgroundColor: c.brand,
      paddingHorizontal: space.lg,
      paddingVertical: space.sm + 2,
      borderRadius: radius.md,
    },
    addPrimaryText: {
      ...text.bodyUiBold,
      color: c.brandText,
    },
    addSecondaryButton: {
      backgroundColor: c.secondaryButtonBg,
      paddingHorizontal: space.lg,
      paddingVertical: space.sm + 2,
      borderRadius: radius.md,
    },
    addSecondaryText: {
      ...text.bodyUiBold,
      color: c.secondaryButtonText,
    },
    friendList: {
      gap: space.md,
    },
    friendCard: {
      backgroundColor: c.surface,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      padding: space.lg,
    },
    friendHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.md,
    },
    friendIdentity: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      flexShrink: 1,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surfaceActive,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      ...text.bodyUiBold,
      color: c.textPrimary,
    },
    friendNameBlock: {
      flexShrink: 1,
    },
    friendName: {
      ...text.bodyUiBold,
      color: c.textPrimary,
    },
    friendSubtitle: {
      ...text.caption,
      color: c.textSecondary,
      marginTop: 2,
    },
    pokeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.brand,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      borderRadius: radius.md,
    },
    pokeButtonPressed: {
      opacity: 0.85,
    },
    pokeButtonText: {
      ...text.label,
      color: c.brandText,
    },
    feedback: {
      ...text.caption,
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: space.base,
    },
    bottomSpacer: {
      height: space.section,
    },
    confettiLayer: {
      ...StyleSheet.absoluteFillObject,
    },
  });
}
