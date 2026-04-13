import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';

import { useAppContext } from '../context/AppContext';
import { palette, typography } from '../theme/claudeTheme';

function extractCode(value: string): string | null {
  const match = value.match(/\d{6}/);
  return match ? match[0] : null;
}

function formatRelativeDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString();
}

export function FriendsScreen() {
  const {
    currentUser,
    friends,
    incomingRequests,
    currentWeekTasks,
    darkModeEnabled,
    myQrPayload,
    rotateFriendCode,
    sendFriendRequestByCode,
    acceptFriendRequest,
    declineFriendRequest,
  } = useAppContext();

  const [permission, requestPermission] = useCameraPermissions();
  const [feedback, setFeedback] = useState('');
  const [rawCodeInput, setRawCodeInput] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const styles = useMemo(() => createStyles(darkModeEnabled), [darkModeEnabled]);

  const normalizedInputPreview = useMemo(() => extractCode(rawCodeInput), [rawCodeInput]);
  const activeIncomingRequest = useMemo(() => incomingRequests[0], [incomingRequests]);

  const activeTasksByFriend = useMemo(() => {
    const bucket = new Map<string, string[]>();
    for (const task of currentWeekTasks) {
      if (!task.completed && task.accountabilityFriendId) {
        const existing = bucket.get(task.accountabilityFriendId) ?? [];
        existing.push(task.title);
        bucket.set(task.accountabilityFriendId, existing);
      }
    }
    return bucket;
  }, [currentWeekTasks]);

  async function submitCode(code: string) {
    const authResult = await sendFriendRequestByCode(code);
    setFeedback(authResult.message);
  }

  async function openScanner() {
    const permissionResult = permission?.granted ? permission : await requestPermission();
    if (!permissionResult.granted) {
      setFeedback('Camera permission is required to scan QR invites.');
      return;
    }

    setIsScannerOpen(true);
  }

  function onQrScanned(event: BarcodeScanningResult) {
    const scannedCode = extractCode(event.data);
    setIsScannerOpen(false);

    if (!scannedCode) {
      setFeedback('QR code did not contain a valid friend code.');
      return;
    }

    void submitCode(scannedCode);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inviteGlowShell}>
          <View style={styles.inviteHalo} />
          <View style={[styles.card, styles.inviteCard]}>
            <Text style={styles.subHeading}>Your Invite Card</Text>
            <Text style={styles.label}>Share your code with a friend</Text>
            <View style={styles.codeRow}>
              <Text style={styles.friendCode}>{currentUser?.friendCode ?? '------'}</Text>
              <Pressable
                style={styles.rotateIconButton}
                onPress={async () => {
                  const actionResult = await rotateFriendCode();
                  setFeedback(actionResult.message);
                }}
              >
                <Ionicons name="refresh" size={20} color={palette.ivory} />
              </Pressable>
            </View>
            <View style={styles.centeredRow}>
              <QRCode size={180} value={myQrPayload || 'ACTBL:000000'} />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.subHeading}>Add a New Friend</Text>
          <TextInput
            style={styles.input}
            value={rawCodeInput}
            onChangeText={setRawCodeInput}
            keyboardType="number-pad"
            placeholder="Enter a 6-digit friend code"
          />
          <Pressable style={styles.primaryButton} onPress={() => void submitCode(rawCodeInput)}>
            <Text style={styles.primaryButtonText}>Send Friend Request</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={openScanner}>
            <Text style={styles.secondaryButtonText}>Scan QR</Text>
          </Pressable>
          <Text style={styles.helperText}>
            Parsed code: {normalizedInputPreview ?? 'No valid 6-digit code yet'}
          </Text>
        </View>

        {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.subHeading}>Friends</Text>
          {friends.length === 0 ? (
            <Text style={styles.emptyText}>You have no linked friends yet.</Text>
          ) : (
            friends.map((friend) => (
              <View key={friend.id} style={styles.friendRow}>
                <View style={styles.friendHeaderRow}>
                  <Text style={styles.listTitle}>{friend.name}</Text>
                  <View style={styles.friendTaskPill}>
                    <Text style={styles.friendTaskPillText}>
                      {activeTasksByFriend.get(friend.id)?.length ?? 0} active
                    </Text>
                  </View>
                </View>
                <Text style={styles.listMeta}>{friend.email}</Text>
                {activeTasksByFriend.get(friend.id)?.length ? (
                  <View style={styles.friendTaskList}>
                    {activeTasksByFriend.get(friend.id)?.slice(0, 3).map((taskTitle) => (
                      <Text key={taskTitle} style={styles.friendTaskText}>
                        - {taskTitle}
                      </Text>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.listMeta}>No active shared tasks yet.</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={Boolean(activeIncomingRequest) && !isScannerOpen}
        animationType="fade"
        onRequestClose={() => {
          return;
        }}
      >
        <View style={styles.incomingModalRoot}>
          <View style={styles.incomingModalCard}>
            <Text style={styles.kicker}>NEW REQUEST</Text>
            <Text style={styles.incomingModalTitle}>Accountability invite</Text>
            <Text style={styles.incomingModalBody}>
              {activeIncomingRequest?.fromName} wants to be your accountability friend.
            </Text>
            <Text style={styles.incomingModalMeta}>{activeIncomingRequest?.fromEmail}</Text>
            <Text style={styles.incomingModalMeta}>
              Sent {activeIncomingRequest ? formatRelativeDate(activeIncomingRequest.createdAt) : ''}
            </Text>

            <View style={styles.incomingActions}>
              <Pressable
                style={styles.incomingAcceptButton}
                onPress={async () => {
                  if (!activeIncomingRequest) {
                    return;
                  }
                  const actionResult = await acceptFriendRequest(activeIncomingRequest.id);
                  setFeedback(actionResult.message);
                }}
              >
                <Text style={styles.incomingAcceptButtonText}>Accept</Text>
              </Pressable>

              <Pressable
                style={styles.incomingDeclineButton}
                onPress={async () => {
                  if (!activeIncomingRequest) {
                    return;
                  }
                  const actionResult = await declineFriendRequest(activeIncomingRequest.id);
                  setFeedback(actionResult.message);
                }}
              >
                <Text style={styles.incomingDeclineButtonText}>Decline</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isScannerOpen} animationType="slide" onRequestClose={() => setIsScannerOpen(false)}>
        <View style={styles.scannerRoot}>
          <Text style={styles.scannerTitle}>Scan Friend QR</Text>
          <CameraView
            style={styles.scanner}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onQrScanned}
          />
          <Pressable style={styles.primaryButton} onPress={() => setIsScannerOpen(false)}>
            <Text style={styles.primaryButtonText}>Close Scanner</Text>
          </Pressable>
        </View>
      </Modal>
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
  card: {
    backgroundColor: card,
    borderWidth: 1,
    borderColor: cardBorder,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
  },
  inviteGlowShell: {
    position: 'relative',
  },
  inviteHalo: {
    position: 'absolute',
    top: -10,
    left: 14,
    right: 14,
    bottom: -8,
    borderRadius: 20,
    backgroundColor: 'rgba(201, 100, 66, 0.28)',
  },
  inviteCard: {
    borderColor: darkModeEnabled ? '#473a34' : '#e5c7bc',
    shadowColor: palette.terracotta,
    shadowOpacity: 0.32,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  subHeading: {
    fontFamily: typography.serif,
    fontSize: 24,
    color: primaryText,
    lineHeight: 29,
  },
  kicker: {
    fontFamily: typography.sans,
    fontSize: 11,
    letterSpacing: 0.5,
    color: palette.stoneGray,
  },
  label: {
    fontSize: 14,
    color: secondaryText,
    fontFamily: typography.sans,
    lineHeight: 22,
  },
  friendCode: {
    fontSize: 34,
    fontFamily: typography.serif,
    letterSpacing: 2,
    color: palette.terracotta,
  },
  rotateIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.terracotta,
  },
  centeredRow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: darkModeEnabled ? '#3a4048' : '#d2c8b5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: inputBg,
    fontSize: 16,
    fontFamily: typography.sans,
    color: primaryText,
  },
  pokeInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: palette.terracotta,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 11,
  },
  primaryButtonText: {
    color: palette.ivory,
    fontFamily: typography.sans,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d2c8b5',
    backgroundColor: palette.warmSand,
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: palette.charcoalWarm,
    fontWeight: '500',
    fontFamily: typography.sans,
  },
  helperText: {
    color: mutedText,
    fontSize: 13,
    fontFamily: typography.sans,
  },
  feedbackText: {
    color: secondaryText,
    textAlign: 'center',
    fontFamily: typography.sans,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: primaryText,
    fontFamily: typography.sans,
  },
  listMeta: {
    color: secondaryText,
    fontSize: 13,
    fontFamily: typography.sans,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallPrimaryButton: {
    flex: 1,
    backgroundColor: palette.terracotta,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  smallPrimaryButtonText: {
    color: palette.ivory,
    fontWeight: '600',
    fontFamily: typography.sans,
  },
  smallSecondaryButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d2c8b5',
    backgroundColor: palette.warmSand,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  smallSecondaryButtonText: {
    color: palette.charcoalWarm,
    fontWeight: '500',
    fontFamily: typography.sans,
  },
  pokeRow: {
    borderWidth: 1,
    borderColor: '#ddd3c3',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    backgroundColor: palette.white,
  },
  sentPokeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd3c3',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: palette.white,
  },
  pokeStatusPill: {
    fontSize: 12,
    fontFamily: typography.sans,
    color: palette.charcoalWarm,
    borderWidth: 1,
    borderColor: '#d2c8b5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  friendRow: {
    borderWidth: 1,
    borderColor: rowBorder,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    backgroundColor: card,
  },
  friendHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  friendTaskPill: {
    borderWidth: 1,
    borderColor: darkModeEnabled ? '#3a4048' : '#d2c8b5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: darkModeEnabled ? '#2a3037' : palette.warmSand,
  },
  friendTaskPillText: {
    fontSize: 12,
    color: darkModeEnabled ? '#f2f2f2' : palette.charcoalWarm,
    fontFamily: typography.sans,
  },
  friendTaskList: {
    gap: 2,
  },
  friendTaskText: {
    fontSize: 13,
    color: secondaryText,
    fontFamily: typography.sans,
  },
  emptyText: {
    color: mutedText,
    fontFamily: typography.sans,
  },
  incomingModalRoot: {
    flex: 1,
    backgroundColor: palette.nearBlack,
    justifyContent: 'center',
    padding: 22,
  },
  incomingModalCard: {
    backgroundColor: darkModeEnabled ? '#1a1d20' : palette.ivory,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: darkModeEnabled ? '#2b2f35' : palette.borderCream,
    padding: 20,
    gap: 10,
  },
  incomingModalTitle: {
    fontFamily: typography.serif,
    color: primaryText,
    fontSize: 36,
    lineHeight: 40,
  },
  incomingModalBody: {
    fontFamily: typography.sans,
    color: secondaryText,
    fontSize: 16,
    lineHeight: 24,
  },
  incomingModalMeta: {
    fontFamily: typography.sans,
    color: mutedText,
    fontSize: 13,
  },
  incomingActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  incomingAcceptButton: {
    flex: 1,
    backgroundColor: palette.terracotta,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  incomingAcceptButtonText: {
    color: palette.ivory,
    fontFamily: typography.sans,
    fontWeight: '600',
  },
  incomingDeclineButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0ccc6',
    backgroundColor: palette.white,
    alignItems: 'center',
    paddingVertical: 12,
  },
  incomingDeclineButtonText: {
    color: palette.errorCrimson,
    fontFamily: typography.sans,
    fontWeight: '600',
  },
  pokeComposerRoot: {
    flex: 1,
    backgroundColor: palette.parchment,
    padding: 16,
  },
  pokeComposerCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: '#dfd7c8',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  scannerRoot: {
    flex: 1,
    backgroundColor: darkModeEnabled ? '#0f1113' : palette.nearBlack,
    padding: 16,
    gap: 12,
    justifyContent: 'center',
  },
  scannerTitle: {
    color: palette.ivory,
    fontFamily: typography.serif,
    fontSize: 26,
    textAlign: 'center',
  },
  scanner: {
    height: 380,
    borderRadius: 16,
    overflow: 'hidden',
  },
  });
}
