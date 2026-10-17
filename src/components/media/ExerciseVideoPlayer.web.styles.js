// EN: Defines the theme-aware layout, spacing, and interaction styles used by ExerciseVideoPlayer.web.
// UK: Визначає залежні від теми layout, spacing та interaction styles для ExerciseVideoPlayer.web.
import { StyleSheet } from 'react-native';
import { palette } from '../../constants/colors';

export const styles = StyleSheet.create({
  video: { backgroundColor: palette.black, height: '100%', width: '100%' },
  container: { alignSelf: 'stretch', borderRadius: 8, minHeight: 1, overflow: 'hidden' },
});
