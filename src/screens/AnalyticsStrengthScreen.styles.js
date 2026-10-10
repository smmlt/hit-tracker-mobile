import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  screen: { backgroundColor: theme.background, flex: 1 },
  content: { alignSelf: 'center', gap: 10, maxWidth: 800, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 8, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  title: { color: theme.textPrimary, flex: 1, fontFamily: 'Inter-Bold', fontSize: 16, textAlign: 'center' },
  subtitle: { color: theme.textSecondary, fontFamily: 'Inter', fontSize: 12, marginVertical: 3 },
  loader: { marginTop: 55 },
  card: { backgroundColor: theme.cardBackground, borderRadius: 10, gap: 8, padding: 12 },
  recordCard: { backgroundColor: theme.cardBackground, borderRadius: 10, gap: 8, padding: 12 },
  recordHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  recordCopy: { flex: 1, gap: 4, paddingRight: 8 },
  recordName: { color: theme.textPrimary, fontFamily: 'Inter-SemiBold', fontSize: 13 },
  muted: { color: theme.textSecondary, fontFamily: 'Inter', fontSize: 11 },
  recordStats: { gap: 3 },
  recordDetail: { color: theme.textPrimary, fontFamily: 'Inter', fontSize: 11 },
  recordDelta: { color: theme.secondary, fontFamily: 'Inter-SemiBold', fontSize: 10, textAlign: 'right' },
  retry: { color: theme.primary, fontFamily: 'Inter-SemiBold', fontSize: 13, paddingVertical: 10 },
});