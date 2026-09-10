import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  picker: { gap: 8 },
  rowCard: { backgroundColor: theme.cardBackground, borderRadius: 12, gap: 12, padding: 12 },
  metric: { flex: 1, minWidth: 65 },
});
