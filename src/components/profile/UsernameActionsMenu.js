import React, { useContext } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { CopyUsernameIcon, EditUsernameIcon } from '../../assets/icons';
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
              <Pressable accessibilityLabel={t('editUsername')} accessibilityRole="button" onPress={onEdit} style={styles.row}>
                <EditUsernameIcon color={theme.textSecondary} height={24} width={24} />
                <Text style={[styles.text, { color: theme.textSecondary }]}>{t('edit')}</Text>
              </Pressable>
            </>
          )}
          <Pressable accessibilityLabel={t('copyUsername')} accessibilityRole="button" onPress={copy} style={styles.row}>
            <CopyUsernameIcon color={theme.textSecondary} height={24} width={24} />
            <Text style={[styles.text, { color: theme.textSecondary }]}>{t('copy')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
