import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 64, paddingHorizontal: 14 },
  headerButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  title: { fontFamily: 'Inter', fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },
  content: { paddingHorizontal: 22, paddingTop: 54 },
  label: { fontFamily: 'Inter', fontSize: 13, marginBottom: 7 },
  input: { borderRadius: 8, borderWidth: 1, fontFamily: 'Inter', fontSize: 16, minHeight: 44, paddingHorizontal: 12 },
  helper: { fontFamily: 'Inter', fontSize: 12, lineHeight: 18, marginTop: 8 },
  description: { fontFamily: 'Inter', fontSize: 13, lineHeight: 19, marginTop: 46 },
});
