import React, { useContext } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { LanguageContext } from '../../localization/LanguageContext';
import { styles } from './UsernameActionsMenu.styles';

export function UsernameActionsMenu({ isOwner = false, onClose, onCopyResult, onEdit, username, visible }) {
  const { theme } = useTheme();
  const { t } = useContext(LanguageContext);

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(`@${username}`);
      onCopyResult?.(t('usernameCopied'));
    } catch (_) {
      onCopyResult?.(t('usernameCopyFailed'));
    }
    onClose();
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel={t('close')} onPress={onClose} style={[styles.backdrop, { backgroundColor: theme.overlay }]} />
        <View style={[styles.menu, { backgroundColor: theme.surfaceElevated }]}>
          {isOwner && (
            <>
              <Pressable accessibilityRole="button" onPress={onEdit} style={styles.row}>
                <Ionicons color={theme.textPrimary} name="pencil-outline" size={20} />
                <Text style={[styles.text, { color: theme.textPrimary }]}>{t('editUsername')}</Text>
              </Pressable>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            </>
          )}
          <Pressable accessibilityRole="button" onPress={copy} style={styles.row}>
            <Ionicons color={theme.textPrimary} name="copy-outline" size={20} />
            <Text style={[styles.text, { color: theme.textPrimary }]}>{t('copyUsername')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
