import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const styles = StyleSheet.create({
  card: { backgroundColor: palette.slate800, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: palette.slate700, overflow: 'hidden' },
  cardHeaderContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.slate800, paddingRight: 12 },
  cardHeaderClickable: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 },
  headerInfo: { flex: 1 },
  workoutType: { color: palette.slate50, fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  workoutDate: { color: palette.slate400, fontSize: 12 },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  
  // ⏱️ СТИЛЬ ДЛЯ БЕЙДЖА ЧАСУ
  durationBadge: { backgroundColor: palette.skyTint, color: palette.sky, fontWeight: 'bold', fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  
  setsBadge: { backgroundColor: palette.orangeTint, color: palette.orangeLegacy, fontWeight: 'bold', fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  arrow: { color: palette.slate500, fontSize: 12, fontWeight: 'bold' },
  deleteButton: { padding: 8, borderRadius: 8, backgroundColor: palette.redWash, justifyContent: 'center', alignItems: 'center' },
  deleteIcon: { fontSize: 14 },
  cardDetails: { padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: palette.slate700, backgroundColor: palette.slate950 },
  notesBox: { backgroundColor: palette.slate800, padding: 10, borderRadius: 8, marginTop: 12, marginBottom: 12, borderWidth: 1, borderColor: palette.slate700 },
  notesTitle: { color: palette.slate400, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  notesText: { color: palette.slate300, fontSize: 13, marginTop: 2, fontStyle: 'italic' },
  detailsHeader: { color: palette.slate400, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 12, marginBottom: 8 },
  noSetsText: { color: palette.slate500, fontSize: 13, fontStyle: 'italic', marginVertical: 6 },
  setsWrapper: { width: '100%' },
});
