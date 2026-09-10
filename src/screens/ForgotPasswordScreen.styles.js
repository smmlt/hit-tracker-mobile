import { StyleSheet } from 'react-native';

import { palette } from '../constants/colors';
export const createStyles = (theme) => StyleSheet.create({
  fill: { flex: 1 },
  emailValue: { color: theme.textPrimary, fontWeight: '600' },
  safeArea: { flex: 1, backgroundColor: theme.background },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20, maxWidth: 440, width: '100%', alignSelf: 'center' },
  formWrapper: { width: '100%' },
  centerContent: { alignItems: 'center', width: '100%' },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: theme.cardBackground, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: theme.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: theme.textSecondary, marginBottom: 24, lineHeight: 22 },
  linkContainer: { marginTop: 20, alignItems: 'center' },
  linkText: { color: theme.textPrimary, fontWeight: '700', fontSize: 14 },
  fullWidthButton: { width: '100%', marginTop: 16 },
});
