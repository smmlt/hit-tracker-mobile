import { StyleSheet } from 'react-native';
import { palette } from '../constants/colors';

export const styles = StyleSheet.create({
  contentBlock: { gap: 16 },
  noMedia: { color: palette.white, fontSize: 12 },
  summary: { gap: 4, paddingHorizontal: 10 },
  musclePanel: { backgroundColor: palette.surface, flexDirection: 'row', gap: 16, minHeight: 172, padding: 10 },
  muscleImage: { backgroundColor: palette.imagePlaceholder, borderRadius: 8, minHeight: 150, width: '43%' },
  muscleList: { flex: 1, gap: 8, justifyContent: 'center' },
});
