import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  container: { padding: 20, maxWidth: 800, alignSelf: 'center', width: '100%', paddingBottom: 60 },
  centerContainer: { flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 20 },
  emptyCard: { backgroundColor: theme.cardBackground, padding: 24, borderRadius: 12, alignItems: 'center' },
  emptyText: { color: theme.textSecondary, fontSize: 14 },
});
