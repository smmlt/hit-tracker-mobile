import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  screen: { backgroundColor: theme.background, flex: 1 },
  content: { alignSelf: 'center', gap: 10, maxWidth: 800, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 8, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  title: { color: theme.textPrimary, flex: 1, fontFamily: 'Inter-Bold', fontSize: 15, textAlign: 'center' },
  rangeLabel: { color: theme.textSecondary, fontFamily: 'Inter', fontSize: 11 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryCard: { backgroundColor: theme.cardBackground, borderRadius: 9, flexBasis: '48%', flexGrow: 1, gap: 4, minHeight: 72, padding: 10 },
  summaryLabel: { color: theme.textSecondary, fontFamily: 'Inter', fontSize: 10 },
  summaryValue: { color: theme.textPrimary, fontFamily: 'Inter-SemiBold', fontSize: 17 },
  card: { backgroundColor: theme.cardBackground, borderRadius: 10, gap: 8, padding: 12 },
  cardTitle: { color: theme.textPrimary, fontFamily: 'Inter-SemiBold', fontSize: 13 },
  muted: { color: theme.textSecondary, fontFamily: 'Inter', fontSize: 11, lineHeight: 16 },
  loader: { marginVertical: 40 },
  retry: { color: theme.primary, fontFamily: 'Inter-SemiBold', fontSize: 13, paddingVertical: 8 },
});