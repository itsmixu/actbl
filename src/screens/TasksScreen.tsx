import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppContext } from '../context/AppContext';
import { palette, typography } from '../theme/claudeTheme';

export function TasksScreen() {
  const {
    currentUser,
    weekStartISO,
    friends,
    incomingPokes,
    currentWeekTasks,
    darkModeEnabled,
    sendPoke,
    respondToPoke,
    defaultPokeMessage,
    createTask,
    toggleTask,
    deleteTask,
  } = useAppContext();

  const [taskTitle, setTaskTitle] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState<string | undefined>(undefined);
  const [pokeMessage, setPokeMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const styles = useMemo(() => createStyles(darkModeEnabled), [darkModeEnabled]);

  const friendNameById = useMemo(() => {
    return Object.fromEntries(friends.map((friend) => [friend.id, friend.name]));
  }, [friends]);

  const weekLabel = useMemo(() => {
    const date = new Date(weekStartISO);
    return date.toLocaleDateString();
  }, [weekStartISO]);

  const ongoingTasks = useMemo(
    () => currentWeekTasks.filter((task) => !task.completed),
    [currentWeekTasks],
  );

  const pendingIncomingPokes = useMemo(
    () => incomingPokes.filter((poke) => poke.status === 'pending'),
    [incomingPokes],
  );

  const tasksWithFriend = useMemo(() => {
    const bucket = new Map<string, string[]>();
    for (const task of ongoingTasks) {
      if (!task.accountabilityFriendId) {
        continue;
      }
      const existing = bucket.get(task.accountabilityFriendId) ?? [];
      existing.push(task.title);
      bucket.set(task.accountabilityFriendId, existing);
    }
    return bucket;
  }, [ongoingTasks]);

  const motivationalMessage = useMemo(() => {
    const firstName = currentUser?.name?.trim().split(' ')[0] ?? 'friend';
    const messages = [
      `${firstName}, one steady week can change everything.`,
      `${firstName}, small wins every day build serious momentum.`,
      `${firstName}, stay close to your promises this week.`,
      `${firstName}, consistency today is confidence tomorrow.`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }, [currentUser?.name]);

  function getTaskFriendLabel(accountabilityFriendId?: string): string {
    if (!accountabilityFriendId) {
      return 'Personal accountability';
    }
    return `With ${friendNameById[accountabilityFriendId] ?? 'Friend'}`;
  }

  async function submitTask() {
    const actionResult = await createTask(taskTitle, selectedFriendId);
    setFeedback(actionResult.message);
    if (actionResult.ok) {
      setTaskTitle('');
    }
  }

  async function submitPoke(friendId: string) {
    const actionResult = await sendPoke(friendId, pokeMessage.trim() ? pokeMessage.trim() : defaultPokeMessage);
    setFeedback(actionResult.message);
    if (actionResult.ok) {
      setPokeMessage('');
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {pendingIncomingPokes.length > 0 ? (
          <View style={[styles.card, styles.incomingCard]}>
            <Text style={styles.subHeading}>Pokes waiting for your response</Text>
            {pendingIncomingPokes.map((poke) => (
              <View key={poke.id} style={styles.pokeRow}>
                <Text style={styles.taskTitle}>{poke.fromName}</Text>
                <Text style={styles.taskMeta}>{poke.message}</Text>
                <View style={styles.rowActions}>
                  <Pressable
                    style={styles.doneButton}
                    onPress={async () => {
                      const actionResult = await respondToPoke(poke.id, 'on_it');
                      setFeedback(actionResult.message);
                    }}
                  >
                    <Text style={styles.doneButtonText}>I'm on it</Text>
                  </Pressable>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={async () => {
                      const actionResult = await respondToPoke(poke.id, 'later');
                      setFeedback(actionResult.message);
                    }}
                  >
                    <Text style={styles.deleteButtonText}>Later</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.brandTitle}>actbl.</Text>

        <View style={styles.card}>
          <Text style={styles.kicker}>WEEKLY FOCUS</Text>
          <Text style={styles.sectionTitle}>What matters this week</Text>
          <Text style={styles.heroMessage}>{motivationalMessage}</Text>
          <Text style={styles.label}>Week starts on {weekLabel}</Text>

          {currentWeekTasks.length === 0 ? (
            <Text style={styles.emptyText}>No tasks yet. Add one below to start this week.</Text>
          ) : (
            currentWeekTasks.map((task) => (
              <View key={task.id} style={styles.taskRow}>
                <Pressable
                  style={styles.taskMain}
                  onPress={async () => {
                    const actionResult = await toggleTask(task.id);
                    setFeedback(actionResult.message);
                  }}
                >
                  <View style={[styles.statusDot, task.completed && styles.statusDotDone]} />
                  <View style={styles.taskTextWrap}>
                    <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>{task.title}</Text>
                    <Text style={styles.taskMeta}>{getTaskFriendLabel(task.accountabilityFriendId)}</Text>
                  </View>
                </Pressable>
                <Pressable
                  style={styles.deleteButton}
                  onPress={async () => {
                    const actionResult = await deleteTask(task.id);
                    setFeedback(actionResult.message);
                  }}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.subHeading}>Friends and pokes</Text>
          <Text style={styles.label}>See shared accountability tasks and send a nudge.</Text>

          <TextInput
            style={styles.input}
            value={pokeMessage}
            onChangeText={setPokeMessage}
            placeholder="Optional custom poke message"
          />

          {friends.length === 0 ? (
            <Text style={styles.emptyText}>No friends linked yet. Add one in the Friends tab.</Text>
          ) : (
            friends.map((friend) => (
              <View key={friend.id} style={styles.friendBlock}>
                <View style={styles.friendRowTop}>
                  <Text style={styles.taskTitle}>{friend.name}</Text>
                  <Pressable style={styles.doneButton} onPress={() => void submitPoke(friend.id)}>
                    <Text style={styles.doneButtonText}>Poke</Text>
                  </Pressable>
                </View>
                {tasksWithFriend.get(friend.id)?.length ? (
                  tasksWithFriend.get(friend.id)?.slice(0, 3).map((title) => (
                    <Text key={`${friend.id}-${title}`} style={styles.taskMeta}>
                      - {title}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.taskMeta}>No active linked tasks yet.</Text>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.subHeading}>Create new task</Text>

          <TextInput
            style={styles.input}
            value={taskTitle}
            onChangeText={setTaskTitle}
            placeholder="Add a weekly task"
          />

          <Text style={styles.label}>Accountability friend (optional)</Text>
          <View style={styles.friendPillsRow}>
            <Pressable
              style={[
                styles.friendPill,
                selectedFriendId === undefined && styles.friendPillSelected,
              ]}
              onPress={() => setSelectedFriendId(undefined)}
            >
              <Text
                style={[
                  styles.friendPillText,
                  selectedFriendId === undefined && styles.friendPillTextSelected,
                ]}
              >
                None
              </Text>
            </Pressable>
            {friends.map((friend) => (
              <Pressable
                key={friend.id}
                style={[
                  styles.friendPill,
                  selectedFriendId === friend.id && styles.friendPillSelected,
                ]}
                onPress={() => setSelectedFriendId(friend.id)}
              >
                <Text
                  style={[
                    styles.friendPillText,
                    selectedFriendId === friend.id && styles.friendPillTextSelected,
                  ]}
                >
                  {friend.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.primaryButton} onPress={() => void submitTask()}>
            <Text style={styles.primaryButtonText}>Add Weekly Task</Text>
          </Pressable>

          {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}
        </View>
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
  const rowBorder = darkModeEnabled ? '#31363d' : '#ddd3c3';
  const inputBg = darkModeEnabled ? '#20242a' : palette.white;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: surface,
    },
  scrollContent: {
    padding: 16,
    paddingTop: 22,
    paddingBottom: 44,
    gap: 14,
  },
  brandTitle: {
    fontFamily: typography.serif,
    fontSize: 35,
    color: primaryText,
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: 2,
  },
  card: {
    backgroundColor: card,
    borderWidth: 1,
    borderColor: cardBorder,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
  },
  incomingCard: {
    borderColor: darkModeEnabled ? '#3b3430' : '#e6c9bf',
    backgroundColor: darkModeEnabled ? '#241f1c' : '#fff7f2',
  },
  heroMessage: {
    fontFamily: typography.sans,
    fontSize: 15,
    lineHeight: 23,
    color: secondaryText,
  },
  kicker: {
    fontFamily: typography.sans,
    fontSize: 11,
    letterSpacing: 0.6,
    color: mutedText,
  },
  sectionTitle: {
    fontFamily: typography.serif,
    fontSize: 31,
    color: primaryText,
    lineHeight: 36,
  },
  subHeading: {
    fontFamily: typography.serif,
    fontSize: 24,
    color: primaryText,
    lineHeight: 29,
  },
  label: {
    color: secondaryText,
    fontSize: 14,
    fontFamily: typography.sans,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: darkModeEnabled ? '#3a4048' : '#d2c8b5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    color: primaryText,
    backgroundColor: inputBg,
    fontFamily: typography.sans,
  },
  friendPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  friendPill: {
    borderWidth: 1,
    borderColor: darkModeEnabled ? '#3a4048' : '#d2c8b5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: inputBg,
  },
  friendPillSelected: {
    backgroundColor: palette.terracotta,
    borderColor: palette.terracotta,
  },
  friendPillText: {
    color: secondaryText,
    fontWeight: '500',
    fontFamily: typography.sans,
  },
  friendPillTextSelected: {
    color: palette.ivory,
  },
  primaryButton: {
    backgroundColor: palette.terracotta,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
  },
  primaryButtonText: {
    color: palette.ivory,
    fontWeight: '600',
    fontFamily: typography.sans,
  },
  feedbackText: {
    color: secondaryText,
    fontFamily: typography.sans,
  },
  friendBlock: {
    borderWidth: 1,
    borderColor: rowBorder,
    borderRadius: 12,
    padding: 10,
    gap: 4,
    backgroundColor: card,
  },
  friendRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  pokeRow: {
    borderWidth: 1,
    borderColor: darkModeEnabled ? '#3a342f' : '#e4d4ca',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    backgroundColor: card,
  },
  emptyText: {
    color: mutedText,
    fontFamily: typography.sans,
  },
  taskRow: {
    borderWidth: 1,
    borderColor: rowBorder,
    borderRadius: 12,
    padding: 10,
    gap: 10,
    backgroundColor: card,
  },
  taskMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  statusDot: {
    marginTop: 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.terracotta,
  },
  statusDotDone: {
    backgroundColor: palette.stoneGray,
  },
  taskTextWrap: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: primaryText,
    fontFamily: typography.sans,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: mutedText,
  },
  taskMeta: {
    fontSize: 13,
    color: secondaryText,
    fontFamily: typography.sans,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  doneButton: {
    borderWidth: 1,
    borderColor: darkModeEnabled ? '#4a5159' : '#d2c8b5',
    backgroundColor: darkModeEnabled ? '#2a3037' : palette.warmSand,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  doneButtonText: {
    color: darkModeEnabled ? '#f2f2f2' : palette.charcoalWarm,
    fontFamily: typography.sans,
    fontWeight: '500',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: darkModeEnabled ? '#5a3a3a' : '#e0ccc6',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: card,
  },
  deleteButtonText: {
    color: palette.errorCrimson,
    fontWeight: '500',
    fontFamily: typography.sans,
  },
  });
}
