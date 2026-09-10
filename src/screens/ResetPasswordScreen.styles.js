import { StyleSheet } from 'react-native';

import { palette } from '../constants/colors';
export const styles = StyleSheet.create({
  fill: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: palette.whitePure },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20, maxWidth: 440, width: '100%', alignSelf: 'center' },
  formWrapper: { width: '100%' },
  centerContent: { alignItems: 'center', width: '100%' },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: palette.gray100, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: palette.blackPure, marginBottom: 8 },
  subtitle: { fontSize: 15, color: palette.gray600, marginBottom: 24, lineHeight: 22 },
  strengthContainer: { marginTop: -8, marginBottom: 12 },
  strengthText: { fontSize: 13, fontWeight: '600', color: palette.blackPure, marginBottom: 6 },
  barsRow: { flexDirection: 'row', gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  barActive: { backgroundColor: palette.blackPure },
  barInactive: { backgroundColor: palette.gray200 },
  requirementsContainer: { marginBottom: 20, gap: 6 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  requirementText: { fontSize: 13, color: palette.gray600 },
  requirementMetText: { color: palette.success, fontWeight: '500' },
  fullWidthButton: { width: '100%', marginTop: 24 },
});
