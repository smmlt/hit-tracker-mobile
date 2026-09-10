import { StyleSheet } from 'react-native';

import { palette } from '../constants/colors';
export const createStyles = (theme) => StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: theme.background },
  container: { alignSelf: 'center', flexGrow: 1, maxWidth: 393, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 34, width: '100%' },
  formWrapper: { marginTop: 88, width: '100%' },
  title: { color: theme.textPrimary, fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: theme.textSecondary, fontSize: 18, lineHeight: 23, marginBottom: 44 },
  codeInputWrapper: { height: 71, position: 'relative', width: '100%' },
  codeCells: { flexDirection: 'row', gap: 7, justifyContent: 'space-between', width: '100%' },
  codeCell: { alignItems: 'center', borderColor: theme.border, borderRadius: 10, borderWidth: 2, flex: 1, height: 71, justifyContent: 'center', maxWidth: 57 },
  codeCellFocused: { borderColor: theme.textPrimary },
  codeCellError: { backgroundColor: palette.errorPale, borderColor: palette.red700 },
  codeCellSuccess: { backgroundColor: palette.successPale, borderColor: palette.greenDarkText },
  codeDigit: { color: theme.textPrimary, fontSize: 28, fontWeight: '600' },
  hiddenCodeInput: { ...StyleSheet.absoluteFillObject, color: palette.transparent, opacity: 0.01 },
  status: { color: theme.textSecondary, fontSize: 15, fontWeight: '700', marginTop: 24, textAlign: 'center' },
  warning: { color: palette.red700, fontSize: 13, lineHeight: 18, marginTop: 10, textAlign: 'center' },
  lockedBox: { alignItems: 'center' },
  requestCode: { color: theme.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 12 },
  bottomLinkContainer: { alignItems: 'center', marginTop: 'auto', paddingTop: 48 },
  bottomText: { color: theme.textPrimary, fontSize: 15, fontWeight: '700' },
});
