import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppContext } from '../context/AppContext';
import { getThemeColors, radius, space, text } from '../theme/theme';

export type DialogActionVariant = 'primary' | 'secondary' | 'destructive';

export interface DialogAction {
  label: string;
  variant?: DialogActionVariant;
  onPress?: () => void | Promise<void>;
}

export interface ThemedDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  /**
   * Optional custom content rendered between the message and the action row.
   * Use this for inputs, pickers, etc.
   */
  children?: React.ReactNode;
  actions: DialogAction[];
  onRequestClose: () => void;
}

/**
 * App-themed replacement for `Alert.alert`. Matches the modal styling used in
 * FriendsScreen so all dialogs feel like one system.
 */
export function ThemedDialog({
  visible,
  title,
  message,
  children,
  actions,
  onRequestClose,
}: ThemedDialogProps) {
  const { darkModeEnabled } = useAppContext();
  const c = getThemeColors(darkModeEnabled);
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {children}
          <View
            style={[
              styles.actionsRow,
              actions.length === 1 && styles.actionsRowSingle,
            ]}
          >
            {actions.map((action, index) => {
              const variant: DialogActionVariant = action.variant ?? 'primary';
              return (
                <Pressable
                  key={`${action.label}-${index}`}
                  onPress={() => {
                    void action.onPress?.();
                  }}
                  style={({ pressed }) => [
                    styles.actionBase,
                    variant === 'primary' && styles.actionPrimary,
                    variant === 'secondary' && styles.actionSecondary,
                    variant === 'destructive' && styles.actionDestructive,
                    pressed && styles.actionPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.actionTextBase,
                      variant === 'primary' && styles.actionTextPrimary,
                      variant === 'secondary' && styles.actionTextSecondary,
                      variant === 'destructive' && styles.actionTextDestructive,
                    ]}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(c: ReturnType<typeof getThemeColors>) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(20, 20, 19, 0.55)',
      justifyContent: 'center',
      paddingHorizontal: space.xl,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      padding: space.xl,
      gap: space.md,
    },
    title: {
      ...text.featureTitle,
      color: c.textPrimary,
    },
    message: {
      ...text.bodyStandard,
      color: c.textSecondary,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: space.sm,
      justifyContent: 'flex-end',
      marginTop: space.sm,
    },
    actionsRowSingle: {
      justifyContent: 'center',
    },
    actionBase: {
      paddingHorizontal: space.lg,
      paddingVertical: space.md,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexGrow: 0,
      flexShrink: 1,
      minWidth: 96,
    },
    actionPrimary: {
      backgroundColor: c.brand,
    },
    actionSecondary: {
      backgroundColor: c.secondaryButtonBg,
    },
    actionDestructive: {
      backgroundColor: c.error,
    },
    actionPressed: {
      opacity: 0.85,
    },
    actionTextBase: {
      ...text.bodyUiBold,
    },
    actionTextPrimary: {
      color: c.brandText,
    },
    actionTextSecondary: {
      color: c.secondaryButtonText,
    },
    actionTextDestructive: {
      color: c.brandText,
    },
  });
}
