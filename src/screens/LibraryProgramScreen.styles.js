import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  contentBlock: { gap: 16 },
  noMedia: { color: theme.textSecondary, fontSize: 12 },
  summary: { gap: 10, paddingHorizontal: 10 },
  addExercise: { justifyContent: 'center', minHeight: 44 },
  tip: { backgroundColor: theme.cardBackground, borderRadius: 10, gap: 8, padding: 14 },
});
