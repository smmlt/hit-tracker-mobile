import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  screen: { backgroundColor: theme.background, flex: 1 },
  content: { alignSelf: 'center', gap: 10, maxWidth: 800, paddingBottom: 34, paddingHorizontal: 20, paddingTop: 8, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  title: { color: theme.textPrimary, flex: 1, fontFamily: 'Inter-Bold', fontSize: 15, textAlign: 'center' },
  card: { backgroundColor: theme.cardBackground, borderRadius: 10, gap: 12, padding: 12 },
  cardTitle: { color: theme.textPrimary, fontFamily: 'Inter-SemiBold', fontSize: 13 },
  hero: { color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 25 },
  unit: { color: theme.textSecondary, fontFamily: 'Inter', fontSize: 12 },
  loader: { marginVertical: 55 },
  groupRow: { gap: 6, paddingVertical: 2 },
  groupHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  groupName: { color: theme.textPrimary, flex: 1, fontFamily: 'Inter', fontSize: 11 },
  groupValue: { color: theme.textPrimary, fontFamily: 'Inter-SemiBold', fontSize: 10 },
  track: { backgroundColor: theme.border, borderRadius: 4, height: 8, overflow: 'hidden' },
  fill: { backgroundColor: theme.primary, borderRadius: 4, height: 8 },
  muted: { color: theme.textSecondary, flex: 1, fontFamily: 'Inter', fontSize: 11, lineHeight: 16 },
  retry: { color: theme.primary, fontFamily: 'Inter-Bold', fontSize: 13, paddingVertical: 10 },
  insightRow: { alignItems: 'center', flexDirection: 'row', gap: 9 },
});
