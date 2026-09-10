import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const createStyles = (theme) => StyleSheet.create({
  filterContainer: { flexDirection: 'row', marginBottom: 10 },
  filterChip: { backgroundColor: theme.filterChipBackground, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 6, borderWidth: 1, borderColor: theme.border },
  filterChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  filterText: { color: theme.filterChipText, fontSize: 11, fontWeight: '600' },
  filterTextActive: { color: theme.onPrimary },

  container: { flexDirection: 'row', marginBottom: 20 },
  chip: { backgroundColor: theme.cardBackground, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: theme.border, minWidth: 130 },
  chipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { color: theme.textPrimary, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: theme.onPrimary },
  chipSubText: { color: theme.textSecondary, fontSize: 10, marginTop: 2 },
  chipSubTextActive: { color: theme.onPrimary },
});
