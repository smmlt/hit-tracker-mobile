import { StyleSheet } from 'react-native';

import { palette } from '../constants/colors';
export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.slate950 },
  container: { padding: 20, maxWidth: 800, alignSelf: 'center', width: '100%', paddingBottom: 60 },
  centerContainer: { flex: 1, backgroundColor: palette.slate950, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: palette.slate50, marginBottom: 20 },
  emptyCard: { backgroundColor: palette.slate800, padding: 24, borderRadius: 12, alignItems: 'center' },
  emptyText: { color: palette.slate400, fontSize: 14 },
});
