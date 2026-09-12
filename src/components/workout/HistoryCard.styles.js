import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.cardBackground,
    borderColor: theme.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 13,
    marginBottom: 12,
    padding: 16,
  },
  pressed: { opacity: 0.72 },
  topRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  titleBlock: { flex: 1, gap: 5 },
  title: { color: theme.textPrimary, fontSize: 17, fontWeight: '800' },
  date: { color: theme.textSecondary, fontSize: 12, textTransform: 'capitalize' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  metricText: { color: theme.textSecondary, fontSize: 12, fontWeight: '700' },
  preview: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  exerciseChip: {
    backgroundColor: theme.filterChipBackground,
    borderRadius: 999,
    maxWidth: 150,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  exerciseChipText: { color: theme.filterChipText, fontSize: 11, fontWeight: '600' },
  moreChip: { borderColor: theme.primary, borderWidth: 1 },
  moreText: { color: theme.primary, fontSize: 11, fontWeight: '800' },
});
