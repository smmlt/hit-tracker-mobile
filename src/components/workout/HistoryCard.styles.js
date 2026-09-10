import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const createStyles = (theme) => StyleSheet.create({
  card: { backgroundColor: theme.cardBackground, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  cardHeaderContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.cardBackground, paddingRight: 12 },
  cardHeaderClickable: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 },
  headerInfo: { flex: 1 },
  workoutType: { color: theme.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  workoutDate: { color: theme.textSecondary, fontSize: 12 },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // Duration badge.
  durationBadge: { backgroundColor: palette.skyTint, color: palette.sky, fontWeight: 'bold', fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  setsBadge: { backgroundColor: palette.orangeTint, color: palette.orangeLegacy, fontWeight: 'bold', fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  arrow: { color: theme.textSecondary, fontSize: 12, fontWeight: 'bold' },
  deleteButton: { padding: 8, borderRadius: 8, backgroundColor: palette.redWash, justifyContent: 'center', alignItems: 'center' },
  deleteIcon: { fontSize: 14 },
  cardDetails: { padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.background },
  notesBox: { backgroundColor: theme.cardBackground, padding: 10, borderRadius: 8, marginTop: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  notesTitle: { color: theme.textSecondary, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  notesText: { color: theme.textPrimary, fontSize: 13, marginTop: 2, fontStyle: 'italic' },
  detailsHeader: { color: theme.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 12, marginBottom: 8 },
  noSetsText: { color: theme.textSecondary, fontSize: 13, fontStyle: 'italic', marginVertical: 6 },
  setsWrapper: { width: '100%' },
});
