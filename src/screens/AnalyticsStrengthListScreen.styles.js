import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  screen: { backgroundColor: theme.background, flex: 1 },
  content: { alignSelf: 'center', gap: 10, maxWidth: 800, paddingBottom: 34, paddingHorizontal: 20, paddingTop: 8, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  backButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  title: { color: theme.textPrimary, flex: 1, fontFamily: 'Inter-Bold', fontSize: 15, textAlign: 'center' },
  search: { alignItems: 'center', backgroundColor: theme.cardBackground, borderRadius: 10, flexDirection: 'row', gap: 8, minHeight: 42, paddingHorizontal: 10 },
  searchInput: { color: theme.textPrimary, flex: 1, fontFamily: 'Inter', fontSize: 12 },
  loader: { marginTop: 60 },
  card: { backgroundColor: theme.cardBackground, borderRadius: 10, gap: 5, padding: 12 },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  recordName: { color: theme.textPrimary, flex: 1, fontFamily: 'Inter-SemiBold', fontSize: 13 },
  detail: { color: theme.textPrimary, fontFamily: 'Inter', fontSize: 11 },
  delta: { color: theme.secondary, fontFamily: 'Inter-SemiBold', fontSize: 10 },
  muted: { color: theme.textSecondary, fontFamily: 'Inter', fontSize: 11 },
  retry: { color: theme.primary, fontFamily: 'Inter-Bold', fontSize: 13, paddingVertical: 10 },
});
