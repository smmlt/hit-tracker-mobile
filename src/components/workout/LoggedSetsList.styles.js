import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const createStyles = (theme) => StyleSheet.create({
  details: { flex: 1 },
  emptyCard: { backgroundColor: theme.cardBackground, padding: 16, borderRadius: 10, alignItems: 'center' },
  emptyText: { color: theme.textSecondary, fontSize: 13 },
  setRow: { backgroundColor: theme.cardBackground, padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: theme.border },
  setTextIndex: { color: palette.orangeLegacy, fontWeight: 'bold', marginRight: 12, fontSize: 14 },
  setName: { color: theme.textPrimary, fontWeight: '600', fontSize: 14 },
  setDetails: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  failureBadge: { backgroundColor: palette.redTint, color: palette.red, fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
});
