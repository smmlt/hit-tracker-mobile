import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 64, paddingHorizontal: 14 },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  title: { fontFamily: 'Inter', fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },
  content: { paddingBottom: 40, paddingHorizontal: 22, paddingTop: 28 },
  field: { marginBottom: 13 },
  label: { fontFamily: 'Inter', fontSize: 13, marginBottom: 6 },
  input: { borderRadius: 8, borderWidth: 1, fontFamily: 'Inter', fontSize: 16, minHeight: 44, paddingHorizontal: 12 },
  usernameRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13, minHeight: 63 },
  usernameContent: { flex: 1 },
  usernameValue: { borderBottomWidth: StyleSheet.hairlineWidth, fontFamily: 'Inter', fontSize: 16, minHeight: 36, paddingBottom: 9 },
  segment: { borderRadius: 8, flexDirection: 'row', overflow: 'hidden', padding: 2 },
  segmentItem: { alignItems: 'center', borderRadius: 6, flex: 1, justifyContent: 'center', minHeight: 36 },
  segmentText: { fontFamily: 'Inter', fontSize: 13 },
  error: { fontFamily: 'Inter', fontSize: 12, marginTop: 12 },
  save: { alignItems: 'center', borderRadius: 8, borderWidth: 1, justifyContent: 'center', marginTop: 42, minHeight: 48 },
  saveText: { fontFamily: 'Inter', fontSize: 14 },
  disabled: { opacity: 0.5 },
});
