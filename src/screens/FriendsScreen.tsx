import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppContext } from '../context/AppContext';
import { fonts, getThemeColors, palette, radius, space, text } from '../theme/theme';

type FriendStatus = 'in_progress' | 'behind' | 'complete';

function getFriendStatus(): FriendStatus {
  // Placeholder: no real friend-task sync yet. Default to in-progress.
  return 'in_progress';
}

/**
 * Extract a 6-digit actbl friend code from a scanned QR payload or pasted code.
 * Accepts payloads like "ACTBL:123456" (the format produced by `myQrPayload`)
 * or any string containing a 6-digit sequence.
 */
function extractFriendCode(raw: string): string | null {
  if (!raw) return null;
  const match = raw.match(/(\d{6})/);
  return match ? match[1] : null;
}

export function FriendsScreen() {
  const {
    currentUser,
    friends,
    myQrPayload,
    darkModeEnabled,
    sendFriendRequestByCode,
    sendPoke,
  } = useAppContext();

  const c = getThemeColors(darkModeEnabled);
  const styles = useMemo(() => createStyles(c), [c]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [codeError, setCodeError] = useState('');
  const [scannerError, setScannerError] = useState('');

  const [permission, requestPermission] = useCameraPermissions();
  // Guard against rapid duplicate scans from the camera stream.
  const scanLockRef = useRef(false);

  function closeAddModal() {
    setIsAddOpen(false);
    setCodeInput('');
    setCodeError('');
  }

  function closeScanner() {
    setIsScannerOpen(false);
    setScannerError('');
    scanLockRef.current = false;
  }

  async function submitCode(rawCode: string): Promise<{ ok: boolean; message: string }> {
    const r = await sendFriendRequestByCode(rawCode);
    setFeedback(r.message);
    return r;
  }

  async function handleAddByCode() {
    const r = await submitCode(codeInput);
    if (r.ok) {
      closeAddModal();
    } else {
      setCodeError(r.message);
    }
  }

  async function handleBarcodeScanned({ data }: { data: string }) {
    if (scanLockRef.current) return;
    const code = extractFriendCode(data);
    if (!code) {
      setScannerError("That QR code doesn't look like an actbl friend code.");
      return;
    }
    scanLockRef.current = true;
    const r = await submitCode(code);
    if (r.ok) {
      closeScanner();
      closeAddModal();
    } else {
      setScannerError(r.message);
      // Allow another scan after a short pause if the request failed.
      setTimeout(() => {
        scanLockRef.current = false;
      }, 1200);
    }
  }

  async function openScanner() {
    setScannerError('');
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) {
        setCodeError('Camera access is required to scan QR codes.');
        return;
      }
    }
    setIsScannerOpen(true);
  }

  async function handlePoke(friendId: string) {
    const r = await sendPoke(friendId);
    setFeedback(r.message);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Friends</Text>
        </View>

        <View style={styles.list}>
          {friends.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyHeading}>No friends yet</Text>
              <Text style={styles.emptyBody}>
                Add a friend with their code or share your QR to start an
                accountability circle.
              </Text>
            </View>
          )}

          {friends.map((friend) => {
            const initial = friend.name?.charAt(0).toUpperCase() ?? '?';
            const status = getFriendStatus();
            return (
              <View key={friend.id} style={styles.friendCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <View style={styles.friendBody}>
                  <Text style={styles.friendName}>{friend.name}</Text>
                  <View style={styles.statusRow}>
                    <Ionicons
                      name={
                        status === 'complete'
                          ? 'checkmark-circle'
                          : 'ellipse-outline'
                      }
                      size={14}
                      color={status === 'complete' ? c.brand : c.textTertiary}
                    />
                    <Text style={styles.statusText}>
                      {status === 'complete'
                        ? 'All tasks complete!'
                        : status === 'behind'
                          ? 'Behind on tasks'
                          : 'Working on this week'}
                    </Text>
                  </View>
                </View>
                {status === 'complete' ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionButton,
                      pressed && styles.actionButtonPressed,
                    ]}
                    onPress={() => {
                      void handlePoke(friend.id);
                    }}
                    accessibilityLabel={`Celebrate ${friend.name}`}
                  >
                    <Ionicons name="sparkles" size={18} color={c.brand} />
                  </Pressable>
                ) : status === 'behind' ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionButton,
                      pressed && styles.actionButtonPressed,
                    ]}
                    onPress={() => {
                      void handlePoke(friend.id);
                    }}
                    accessibilityLabel={`Poke ${friend.name}`}
                  >
                    <Ionicons
                      name="hand-left-outline"
                      size={18}
                      color={c.brand}
                    />
                  </Pressable>
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.chevronButton,
                      pressed && styles.chevronButtonPressed,
                    ]}
                    onPress={() => {
                      void handlePoke(friend.id);
                    }}
                    accessibilityLabel={`Poke ${friend.name}`}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={c.textSecondary}
                    />
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed bottom action row */}
      <View style={styles.bottomActions}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryAction,
            pressed && styles.primaryActionPressed,
          ]}
          onPress={() => {
            setFeedback('');
            setIsAddOpen(true);
          }}
        >
          <Ionicons name="person-add-outline" size={18} color={c.brandText} />
          <Text style={styles.primaryActionText}>Add Friends</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryAction,
            pressed && styles.secondaryActionPressed,
          ]}
          onPress={() => {
            setIsQrOpen(true);
          }}
        >
          <Ionicons
            name="qr-code-outline"
            size={18}
            color={c.secondaryButtonText}
          />
          <Text style={styles.secondaryActionText}>Show QR</Text>
        </Pressable>
      </View>

      {/* Add Friend Modal */}
      <Modal
        visible={isAddOpen}
        transparent
        animationType="fade"
        onRequestClose={closeAddModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add a friend</Text>
              <Pressable
                onPress={closeAddModal}
                style={styles.modalCloseButton}
                hitSlop={10}
              >
                <Ionicons name="close" size={20} color={c.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalBody}>
              Enter their 6-digit friend code.
            </Text>
            <View style={styles.inputWithButtonRow}>
              <TextInput
                value={codeInput}
                onChangeText={(v) => {
                  setCodeInput(v);
                  setCodeError('');
                }}
                placeholder="000000"
                placeholderTextColor={c.textTertiary}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.modalInputInline}
                autoFocus
                onSubmitEditing={handleAddByCode}
              />
              <Pressable
                onPress={handleAddByCode}
                style={({ pressed }) => [
                  styles.inputInlineButton,
                  pressed && styles.inputInlineButtonPressed,
                ]}
                accessibilityLabel="Add friend"
              >
                <Ionicons name="arrow-forward" size={20} color={c.brandText} />
              </Pressable>
            </View>
            {codeError ? (
              <Text style={styles.errorText}>{codeError}</Text>
            ) : null}

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={() => {
                void openScanner();
              }}
              style={({ pressed }) => [
                styles.scanCtaButton,
                pressed && styles.scanCtaButtonPressed,
              ]}
            >
              <Ionicons name="scan-outline" size={18} color={c.secondaryButtonText} />
              <Text style={styles.scanCtaText}>Scan their QR code</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Full-screen QR Scanner */}
      <Modal
        visible={isScannerOpen}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeScanner}
      >
        <View style={styles.scannerRoot}>
          <StatusBar barStyle="light-content" />
          {permission?.granted && isScannerOpen && (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarcodeScanned}
            />
          )}

          {/* Dark overlay edges + reticle */}
          <View style={styles.scannerOverlay} pointerEvents="none">
            <View style={styles.scannerReticle} />
          </View>

          {/* Top explainer text */}
          <SafeAreaView style={styles.scannerTop} edges={['top']}>
            <Text style={styles.scannerTitle}>Scan a friend's QR code</Text>
            <Text style={styles.scannerSubtitle}>
              Point your camera at their actbl friend QR.
            </Text>
            {scannerError ? (
              <Text style={styles.scannerError}>{scannerError}</Text>
            ) : null}
          </SafeAreaView>

          {/* Bottom action buttons */}
          <SafeAreaView style={styles.scannerBottom} edges={['bottom']}>
            <Pressable
              onPress={closeScanner}
              style={({ pressed }) => [
                styles.scannerCloseButton,
                pressed && styles.scannerCloseButtonPressed,
              ]}
            >
              <Ionicons name="close" size={20} color={palette.ivory} />
              <Text style={styles.scannerCloseText}>Cancel</Text>
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        visible={isQrOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsQrOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your friend code</Text>
              <Pressable
                onPress={() => setIsQrOpen(false)}
                style={styles.modalCloseButton}
                hitSlop={10}
              >
                <Ionicons name="close" size={20} color={c.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.modalBody}>
              A friend can scan this QR, or enter the code below.
            </Text>
            <View style={styles.qrWrap}>
              <View style={styles.qrSurface}>
                <QRCode
                  value={myQrPayload || 'ACTBL:------'}
                  size={200}
                  color={palette.nearBlack}
                  backgroundColor={palette.white}
                />
              </View>
            </View>
            <View style={styles.codeDisplay}>
              <Text style={styles.codeText}>
                {currentUser?.friendCode ?? '------'}
              </Text>
            </View>
            <Pressable
              style={[styles.modalPrimaryButton, styles.modalFullButton]}
              onPress={() => setIsQrOpen(false)}
            >
              <Text style={styles.modalPrimaryText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
      paddingTop: space.section,
      paddingBottom: 140,
    },
    header: {
      alignItems: 'center',
      marginBottom: space.xl,
    },
    headerTitle: {
      ...text.subHeading,
      color: c.textPrimary,
    },
    list: {
      gap: space.md,
    },
    emptyCard: {
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      borderWidth: 1,
      borderColor: c.border,
      padding: space.xl,
      alignItems: 'center',
      gap: space.sm,
    },
    emptyHeading: {
      ...text.featureTitle,
      color: c.textPrimary,
      textAlign: 'center',
    },
    emptyBody: {
      ...text.bodyStandard,
      color: c.textSecondary,
      textAlign: 'center',
    },
    friendCard: {
      backgroundColor: c.surface,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: space.base,
      paddingHorizontal: space.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.base,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.surfaceActive,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      ...text.bodyUiBold,
      color: c.textPrimary,
    },
    friendBody: {
      flex: 1,
      gap: 2,
    },
    friendName: {
      ...text.bodyLarge,
      color: c.textPrimary,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    statusText: {
      ...text.caption,
      color: c.textSecondary,
    },
    chevronButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chevronButtonPressed: {
      backgroundColor: c.surfaceActive,
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.surfaceActive,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonPressed: {
      opacity: 0.7,
    },
    feedback: {
      ...text.caption,
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: space.base,
    },
    bottomSpacer: {
      height: space.xl,
    },
    bottomActions: {
      position: 'absolute',
      bottom: space.base,
      left: space.xl,
      right: space.xl,
      flexDirection: 'row',
      gap: space.md,
    },
    primaryAction: {
      flex: 1,
      backgroundColor: c.brand,
      borderRadius: radius.pill,
      paddingVertical: space.base,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.sm,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    primaryActionPressed: {
      opacity: 0.9,
    },
    primaryActionText: {
      ...text.bodyUiBold,
      color: c.brandText,
    },
    secondaryAction: {
      flex: 1,
      backgroundColor: c.secondaryButtonBg,
      borderRadius: radius.pill,
      paddingVertical: space.base,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.sm,
    },
    secondaryActionPressed: {
      opacity: 0.9,
    },
    secondaryActionText: {
      ...text.bodyUiBold,
      color: c.secondaryButtonText,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(20, 20, 19, 0.55)',
      justifyContent: 'center',
      paddingHorizontal: space.xl,
    },
    modalCard: {
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      padding: space.xl,
      gap: space.md,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTitle: {
      ...text.featureTitle,
      color: c.textPrimary,
    },
    modalCloseButton: {
      padding: 4,
    },
    modalBody: {
      ...text.bodyStandard,
      color: c.textSecondary,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      marginVertical: space.xs,
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
    scanCtaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.sm,
      backgroundColor: c.secondaryButtonBg,
      paddingVertical: space.md,
      borderRadius: radius.md,
    },
    scanCtaButtonPressed: {
      opacity: 0.85,
    },
    scanCtaText: {
      ...text.bodyUiBold,
      color: c.secondaryButtonText,
    },
    inputWithButtonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingLeft: space.base,
      paddingRight: space.sm,
      paddingVertical: space.sm,
      gap: space.sm,
    },
    modalInputInline: {
      flex: 1,
      ...text.featureTitle,
      color: c.textPrimary,
      letterSpacing: 4,
      textAlign: 'center',
      fontFamily: fonts.sans,
      paddingVertical: space.md,
    },
    inputInlineButton: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputInlineButtonPressed: {
      opacity: 0.85,
    },
    errorText: {
      ...text.caption,
      color: c.error,
      textAlign: 'center',
    },
    modalActions: {
      flexDirection: 'row',
      gap: space.sm,
      justifyContent: 'flex-end',
      marginTop: space.sm,
    },
    modalPrimaryButton: {
      backgroundColor: c.brand,
      paddingHorizontal: space.lg,
      paddingVertical: space.md,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    modalFullButton: {
      marginTop: space.md,
    },
    modalPrimaryText: {
      ...text.bodyUiBold,
      color: c.brandText,
    },
    modalSecondaryButton: {
      backgroundColor: c.secondaryButtonBg,
      paddingHorizontal: space.lg,
      paddingVertical: space.md,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    modalSecondaryText: {
      ...text.bodyUiBold,
      color: c.secondaryButtonText,
    },
    scannerRoot: {
      flex: 1,
      backgroundColor: palette.nearBlack,
    },
    scannerOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scannerReticle: {
      width: 260,
      height: 260,
      borderWidth: 3,
      borderColor: palette.ivory,
      borderRadius: radius.xxl,
      backgroundColor: 'transparent',
    },
    scannerTop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: space.xl,
      paddingTop: space.base,
      paddingBottom: space.xl,
      alignItems: 'center',
      gap: space.sm,
    },
    scannerTitle: {
      ...text.subHeading,
      color: palette.ivory,
      textAlign: 'center',
    },
    scannerSubtitle: {
      ...text.bodyStandard,
      color: palette.ivory,
      textAlign: 'center',
      opacity: 0.85,
    },
    scannerError: {
      ...text.caption,
      color: palette.ivory,
      backgroundColor: 'rgba(181, 51, 51, 0.85)',
      paddingHorizontal: space.md,
      paddingVertical: 6,
      borderRadius: radius.sm,
      overflow: 'hidden',
      textAlign: 'center',
      marginTop: space.sm,
    },
    scannerBottom: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: space.xl,
      paddingBottom: space.base,
      alignItems: 'center',
    },
    scannerCloseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      backgroundColor: 'rgba(20, 20, 19, 0.65)',
      borderWidth: 1,
      borderColor: 'rgba(250, 249, 245, 0.35)',
      paddingHorizontal: space.xl,
      paddingVertical: space.md,
      borderRadius: radius.pill,
    },
    scannerCloseButtonPressed: {
      opacity: 0.8,
    },
    scannerCloseText: {
      ...text.bodyUiBold,
      color: palette.ivory,
    },
    qrWrap: {
      alignItems: 'center',
      paddingVertical: space.base,
    },
    qrSurface: {
      padding: space.base,
      backgroundColor: palette.white,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    codeDisplay: {
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingVertical: space.base,
      alignItems: 'center',
    },
    codeText: {
      ...text.displayHero,
      fontSize: 32,
      lineHeight: 36,
      letterSpacing: 6,
      color: c.brand,
    },
  });
}
