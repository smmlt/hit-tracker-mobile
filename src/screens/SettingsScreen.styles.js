import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 56, paddingHorizontal: 14 },
  back: { alignItems: 'center', height: 40, justifyContent: 'center', width: 32 },
  backText: { fontSize: 32, fontWeight: '300' },
  title: { fontSize: 14, fontWeight: '800', marginLeft: 10, textTransform: 'uppercase' },
  content: { paddingHorizontal: 22, paddingBottom: 34 },
  label: { fontSize: 12, marginBottom: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 14 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  rowText: { fontSize: 14 },
  choiceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  segment: { borderRadius: 8, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' },
  segmentItem: { alignItems: 'center', justifyContent: 'center', minHeight: 30, paddingHorizontal: 12 },
  segmentText: { fontSize: 12 },
  logout: { alignItems: 'center', borderRadius: 8, borderWidth: 1, justifyContent: 'center', marginTop: 28, minHeight: 46 },
  logoutText: { fontSize: 14, fontWeight: '700' },
});
