import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  mediaPreview: { aspectRatio: 333 / 226, alignSelf: "center", borderRadius: 8, maxWidth: 520, width: "100%" },
  picker: { gap: 8 },
  rowCard: { backgroundColor: theme.cardBackground, borderRadius: 12, gap: 12, padding: 12 },
  metric: { flex: 1, minWidth: 65 },
});
