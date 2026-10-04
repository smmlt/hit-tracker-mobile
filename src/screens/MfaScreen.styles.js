import { StyleSheet } from 'react-native';
import { palette } from '../constants/colors';

export const createStyles = (theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.background },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
    },
    title: {
      color: theme.textPrimary,
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 8,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 24,
    },
    setupCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    label: { color: theme.textSecondary, fontSize: 13, marginBottom: 8 },
    secret: {
      color: theme.textPrimary,
      fontFamily: 'monospace',
      fontSize: 15,
      lineHeight: 24,
      marginBottom: 12,
    },
    link: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 18,
    },
    error: {
      color: palette.red700,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 12,
    },
    cancel: { alignItems: 'center', marginTop: 20 },
  });
