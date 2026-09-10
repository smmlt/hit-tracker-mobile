import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: { gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  item: { flexBasis: 340, flexGrow: 1, maxWidth: 600, minWidth: 0 },
  programActions: { gap: 8, padding: 12 },
  exerciseActions: { padding: 12 },
});
