import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const styles = StyleSheet.create({
  details: { flex: 1 },
  emptyCard: { backgroundColor: palette.slate800, padding: 16, borderRadius: 10, alignItems: 'center' },
  emptyText: { color: palette.slate500, fontSize: 13 },
  setRow: { backgroundColor: palette.slate800, padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: palette.slate700 },
  setTextIndex: { color: palette.orangeLegacy, fontWeight: 'bold', marginRight: 12, fontSize: 14 },
  setName: { color: palette.slate50, fontWeight: '600', fontSize: 14 },
  setDetails: { color: palette.slate400, fontSize: 12, marginTop: 2 },
  failureBadge: { backgroundColor: palette.redTint, color: palette.red, fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
});
