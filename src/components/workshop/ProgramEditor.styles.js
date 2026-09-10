import { StyleSheet } from 'react-native';
import { palette } from '../../constants/colors';

export const styles = StyleSheet.create({
  picker: { gap: 8 },
  rowCard: { backgroundColor: palette.surface, borderRadius: 12, gap: 12, padding: 12 },
  metric: { flex: 1, minWidth: 65 },
});
