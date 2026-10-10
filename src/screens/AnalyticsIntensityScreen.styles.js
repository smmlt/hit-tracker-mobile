import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  screen: { backgroundColor: theme.background, flex: 1 },
  content: { alignSelf: 'center', gap: 10, maxWidth: 800, paddingBottom: 36, paddingHorizontal: 20, paddingTop: 8, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  title: { color: theme.textPrimary, flex: 1, fontFamily: 'Inter-Bold', fontSize: 15, textAlign: 'center' },
  loader: { marginTop: 80 },
  card: { backgroundColor: theme.cardBackground, borderRadius: 10, gap: 8, overflow: 'hidden', padding: 12 },
  chartBox: { overflow: 'hidden', width: '100%' },
  cardTitle: { color: theme.textPrimary, fontFamily: 'Inter-SemiBold', fontSize: 13 },
  hero: { color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 25 },
  unit: { color: theme.textSecondary, fontFamily: 'Inter', fontSize: 12 },
  muted: { color: theme.textSecondary, fontFamily: 'Inter', fontSize: 11, lineHeight: 16 },
  retry: { color: theme.primary, fontFamily: 'Inter-Bold', fontSize: 13, paddingVertical: 10 },
  axisText: { color: theme.textSecondary, fontFamily: 'Inter', fontSize: 9 },
  bandRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  bandLabel: { color: theme.textPrimary, fontFamily: 'Inter', fontSize: 11, width: 58 },
  track: { backgroundColor: theme.border, borderRadius: 5, flex: 1, height: 16, overflow: 'hidden' },
  fill: { backgroundColor: theme.primary, borderRadius: 5, height: '100%' },
  bandValue: { color: theme.textPrimary, fontFamily: 'Inter-SemiBold', fontSize: 11, textAlign: 'right', width: 38 },
});
