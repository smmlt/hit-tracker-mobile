import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { padding: 16, paddingBottom: 48, gap: 14 },
  title: { color: theme.textPrimary, fontSize: 28, fontFamily: 'Inter-Bold' },
  card: { backgroundColor: theme.cardBackground, borderColor: theme.border, borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  heading: { color: theme.textPrimary, fontSize: 17, fontFamily: 'Inter-Bold' },
  large: { color: theme.textPrimary, fontSize: 28, fontFamily: 'Inter-Bold' },
  muted: { color: theme.textSecondary, fontSize: 13, fontFamily: 'Inter' },
  hint: { color: theme.textPrimary, fontSize: 13, fontFamily: 'Inter', backgroundColor: theme.cardBackground, padding: 12, borderRadius: 10 },
  retry: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center' },
  retryText: { color: theme.primary, fontSize: 14, fontFamily: 'Inter-Bold' },
  record: { borderTopWidth: 1, borderTopColor: theme.border, paddingVertical: 12, minHeight: 56, justifyContent: 'center' },
  recordName: { color: theme.textPrimary, fontSize: 15, fontFamily: 'Inter-SemiBold' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  metric: { width: '50%', paddingVertical: 8 },
  metricValue: { color: theme.textPrimary, fontSize: 18, fontFamily: 'Inter-Bold' },
});
