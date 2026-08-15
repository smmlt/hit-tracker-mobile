import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  cardWrapper: { borderRadius: 12, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  cardInnerRow: { alignItems: 'center', backgroundColor: '#292929', flexDirection: 'row', marginBottom: 4, padding: 12, width: '100%' },
  imagePlaceholder: { alignItems: 'center', backgroundColor: '#7C3AED', borderRadius: 10, flexShrink: 0, height: 75, justifyContent: 'center', marginRight: 4, width: 75 },
  placeholderText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  infoContainer: { flex: 1, justifyContent: 'center', paddingLeft: 20 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  muscles: { fontSize: 13, marginBottom: 8 },
  statsRow: { alignItems: 'center', flexDirection: 'row' },
  iconButton: { alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  difficultyContainer: { alignItems: 'center', flexDirection: 'row', marginRight: 10 },
  likesCount: { fontSize: 13, fontWeight: '600' },
});
