import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15 },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: 'bold' },
  headerSpacer: { width: 60 },
  scroll: { padding: 20 },
  exerciseName: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  section: { marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 8 },
  description: { fontSize: 15, lineHeight: 22 },
  empty: { fontSize: 14, fontStyle: 'italic' },
  muscleTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muscleTag: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  muscleTagText: { fontSize: 13 },
  safetyBox: { backgroundColor: '#292929', borderLeftColor: '#EAB308', borderLeftWidth: 4, borderRadius: 10, marginBottom: 20, padding: 15 },
  safetyTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  safetyTip: { fontSize: 13, marginBottom: 6 },
  video: { marginTop: 4 },
});
