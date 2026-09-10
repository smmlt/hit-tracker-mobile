import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: 34, paddingHorizontal: 20 },
  page: { maxWidth: 353, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 56 },
  headerButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  title: { fontFamily: 'Inter-Bold', fontSize: 16, lineHeight: 22, textTransform: 'uppercase' },
  content: { alignItems: 'center', paddingTop: 15 },
  avatar: { borderRadius: 108, height: 216, width: 216 },
  name: { fontFamily: 'Inter-SemiBold', fontSize: 24, lineHeight: 34, marginTop: 16, textAlign: 'center' },
  usernameButton: { justifyContent: 'center', minHeight: 34, paddingHorizontal: 16 },
  username: { fontFamily: 'Inter', fontSize: 16, lineHeight: 22 },
  goal: { borderRadius: 10, marginTop: 24, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 10, width: 279 },
  goalRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  goalBody: { flex: 1 },
  goalText: { fontFamily: 'Inter-Bold', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  goalTrack: { borderRadius: 2, height: 4, marginTop: 7, overflow: 'hidden' },
  goalProgress: { borderRadius: 2, height: 4, width: '34%' },
  outlineButton: { alignItems: 'center', borderRadius: 12, borderWidth: 1, justifyContent: 'center', marginTop: 104, minHeight: 44, width: '100%' },
  buttonText: { fontFamily: 'Inter', fontSize: 16 },
  toast: { alignSelf: 'center', borderRadius: 8, bottom: 20, fontFamily: 'Inter', fontSize: 13, paddingHorizontal: 16, paddingVertical: 10, position: 'absolute' },
});
