import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  contentBlock: { gap: 16 },
  noMedia: { color: theme.textSecondary, fontSize: 12 },
  summary: { gap: 10, paddingHorizontal: 10 },
  programDifficulty: {
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  programDifficultyCopy: { flex: 1, gap: 2 },
  programDifficultyLabel: { color: theme.textSecondary, fontFamily: 'Inter', fontSize: 12, lineHeight: 17 },
  programDifficultyValue: { color: theme.textPrimary, fontFamily: 'Inter-SemiBold', fontSize: 14, lineHeight: 20 },
  programDifficultyHint: { color: theme.textSecondary, fontFamily: 'Inter', fontSize: 11, lineHeight: 16 },
  addExercise: { justifyContent: 'center', minHeight: 44 },
  tip: { backgroundColor: theme.cardBackground, borderRadius: 10, gap: 8, padding: 14 },
});
