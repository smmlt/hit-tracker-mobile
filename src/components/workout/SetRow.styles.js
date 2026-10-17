// EN: Defines the theme-aware layout, spacing, and interaction styles used by SetRow.
// UK: Визначає залежні від теми layout, spacing та interaction styles для SetRow.
import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
/** EN: Builds the theme-aware style sheet used by SetRow. UK: Створює залежну від теми таблицю стилів для SetRow. */
export const createStyles = (theme) => StyleSheet.create({
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.cardBackground,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: theme.border
  },
  setMainInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  setNumber: { color: palette.orangeLegacy, fontWeight: 'bold', width: 28, fontSize: 13 },
  setInfoContainer: { flex: 1 },
  exerciseName: { color: theme.textPrimary, fontWeight: '600', fontSize: 14 },
  setMetrics: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  failureBadge: { backgroundColor: palette.redTint, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  failureBadgeText: { color: palette.red, fontSize: 10, fontWeight: 'bold' },
});
