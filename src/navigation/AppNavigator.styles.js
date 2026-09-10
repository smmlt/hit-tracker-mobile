import { StyleSheet } from 'react-native';
import { palette } from '../constants/colors';

export const styles = StyleSheet.create({
  analyticsPlaceholder: { backgroundColor: palette.black, flex: 1 },
  container: { flex: 1 },
  loading: {
    alignItems: 'center',
    backgroundColor: palette.slate950,
    flex: 1,
    justifyContent: 'center',
  },
});
