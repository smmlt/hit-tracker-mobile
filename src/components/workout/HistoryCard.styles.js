import { StyleSheet } from 'react-native';
import { palette } from '../../constants/colors';

export const createStyles = (theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pressed: { opacity: 0.72 },
  topRow: { flexDirection: 'row' },
  titleBlock: { flex: 1, gap: 5 },
  title: { color: theme.textPrimary, fontSize: 16, fontWeight: '700' },
  date: { color: theme.textSecondary, fontSize: 11 },
  metrics: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: palette.surfaceBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 18,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  duration: { color: theme.textPrimary, fontSize: 16 },
  metricText: { color: theme.textSecondary, fontSize: 13 },
  metricValue: { color: theme.textPrimary, fontSize: 16 },
  preview: { alignItems: 'center', flexDirection: 'row', gap: 10, overflow: 'hidden' },
  previewNames: { flexDirection: 'row', flexShrink: 0 },
  previewText: { color: palette.lightGray, flexShrink: 0, fontSize: 13 },
  moreText: { color: theme.secondary, flexShrink: 0, fontSize: 13, fontWeight: '700' },
});
