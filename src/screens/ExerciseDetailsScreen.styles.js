/**
 * Layout styles used by ExerciseDetailsScreen, defining its themed spacing, typography, controls, and responsive geometry. / Стилі макета для ExerciseDetailsScreen, що визначають тематичні відступи, типографіку, елементи керування та адаптивну геометрію.
 */
import { StyleSheet } from 'react-native';
import { palette } from '../constants/colors';

/** EN: Builds the theme-aware style sheet used by ExerciseDetailsScreen. UK: Створює залежну від теми таблицю стилів для ExerciseDetailsScreen. */
export const createStyles = (theme) => StyleSheet.create({
  contentBlock: { gap: 16 },
  noMedia: { color: theme.textSecondary, fontFamily: 'Inter', fontSize: 12 },
  summary: { gap: 4, paddingHorizontal: 10 },
  musclePanel: {
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    flexDirection: 'row',
    gap: 10,
    minHeight: 172,
    padding: 10,
  },
  muscleImage: {
    aspectRatio: 1,
    backgroundColor: theme.mediaPlaceholder,
    borderRadius: 8,
    maxWidth: 150,
    width: '43%',
  },
  muscleList: { flex: 1, gap: 8, justifyContent: 'center', minWidth: 0, paddingHorizontal: 8 },
  muscleGroup: { gap: 4 },
  muscleGroupTitle: { color: theme.textPrimary, fontFamily: 'Inter', fontSize: 12, fontWeight: '700' },
  muscleItem: { alignItems: 'flex-start', flexDirection: 'row', gap: 6 },
  muscleDash: { color: theme.textSecondary, fontFamily: 'Inter', fontSize: 13, lineHeight: 19 },
  muscleName: { flex: 1, minWidth: 0 },
  muscleText: { color: theme.textSecondary, fontFamily: 'Inter', fontSize: 13, lineHeight: 19 },
  addButton: { borderRadius: 12 },
  addButtonText: { color: palette.black, fontFamily: 'Inter', fontSize: 16, fontWeight: '400' },
});
