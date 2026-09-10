import { StyleSheet } from 'react-native';
import { palette } from '../../constants/colors';

export const styles = StyleSheet.create({
  video: { backgroundColor: palette.black, height: '100%', width: '100%' },
  container: { aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden', width: '100%' },
});
