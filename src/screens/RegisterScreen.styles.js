import { StyleSheet } from 'react-native';

import { palette } from '../constants/colors';
export const styles = StyleSheet.create({
  fill: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: palette.whitePure },
  container: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 20, 
    maxWidth: 440, 
    width: '100%', 
    alignSelf: 'center' 
  },
  formWrapper: { width: '100%' },
  title: { fontSize: 28, fontWeight: '700', color: palette.blackPure, marginBottom: 4 },
  subtitle: { fontSize: 16, color: palette.gray600, marginBottom: 20 },
  hintsContainer: { marginTop: -4, marginBottom: 16 },
  hintItem: { fontSize: 13, marginBottom: 4 },
  hintPending: { color: palette.gray500 },
  hintSuccess: { color: palette.success, fontWeight: '600' },
  errorMessage: { color: palette.red700, fontSize: 13, lineHeight: 18, marginTop: 10, textAlign: 'center' },
  bottomLinkContainer: { marginTop: 24, alignItems: 'center' },
  bottomText: { color: palette.gray600, fontSize: 14 },
  boldText: { color: palette.blackPure, fontWeight: '700' },
});
