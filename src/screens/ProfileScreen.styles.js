import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 14 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 56 },
  headerButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  title: { fontFamily: 'Inter', fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },
  content: { alignItems: 'center', paddingTop: 54 },
  avatar: { borderRadius: 14, height: 216, width: 221 },
  name: { fontFamily: 'Inter', fontSize: 24, fontWeight: '700', marginTop: 14 },
  usernameButton: { justifyContent: 'center', minHeight: 34, paddingHorizontal: 16 },
  username: { fontFamily: 'Inter', fontSize: 13 },
  goal: { borderRadius: 6, marginTop: 28, overflow: 'hidden', paddingHorizontal: 12, paddingTop: 10, width: 180 },
  goalText: { fontFamily: 'Inter', fontSize: 11, fontWeight: '700' },
  goalProgress: { height: 3, marginTop: 7, width: 42 },
  outlineButton: { alignItems: 'center', borderRadius: 8, borderWidth: 1, justifyContent: 'center', marginTop: 70, minHeight: 48 },
  buttonText: { fontFamily: 'Inter', fontSize: 14 },
  toast: { alignSelf: 'center', borderRadius: 8, bottom: 20, fontFamily: 'Inter', fontSize: 13, paddingHorizontal: 16, paddingVertical: 10, position: 'absolute' },
});
