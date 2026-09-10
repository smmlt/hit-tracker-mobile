import { StyleSheet } from 'react-native';
import { palette } from '../../constants/colors';

export const styles = StyleSheet.create({
  video: { backgroundColor: palette.black, height: '100%', width: '100%' },
  container: { alignSelf: 'stretch', borderRadius: 8, minHeight: 1, overflow: 'hidden' },
});
