import { StyleSheet } from 'react-native';
import { palette } from '../constants/colors';

export const styles = StyleSheet.create({
  contentBlock: { gap: 16 },
  noMedia: { color: palette.white, fontSize: 12 },
  summary: { gap: 10, paddingHorizontal: 10 },
  addExercise: { justifyContent: 'center', minHeight: 44 },
  tip: { backgroundColor: palette.surface, borderRadius: 10, gap: 8, padding: 14 },
});
