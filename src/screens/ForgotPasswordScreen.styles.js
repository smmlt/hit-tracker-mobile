import { StyleSheet } from 'react-native';

import { palette } from '../constants/colors';
export const styles = StyleSheet.create({
  fill: { flex: 1 },
  emailValue: { color: palette.blackPure, fontWeight: '600' },
  safeArea: { flex: 1, backgroundColor: palette.whitePure },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20, maxWidth: 440, width: '100%', alignSelf: 'center' },
  formWrapper: { width: '100%' },
  centerContent: { alignItems: 'center', width: '100%' },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: palette.gray100, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: palette.blackPure, marginBottom: 8 },
  subtitle: { fontSize: 15, color: palette.gray600, marginBottom: 24, lineHeight: 22 },
  linkContainer: { marginTop: 20, alignItems: 'center' },
  linkText: { color: palette.blackPure, fontWeight: '700', fontSize: 14 },
  fullWidthButton: { width: '100%', marginTop: 16 },
});
