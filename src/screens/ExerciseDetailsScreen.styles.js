import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  contentBlock: { gap: 16 },
  noMedia: { color: theme.textSecondary, fontSize: 12 },
  summary: { gap: 4, paddingHorizontal: 10 },
  musclePanel: { backgroundColor: theme.cardBackground, flexDirection: 'row', gap: 16, minHeight: 172, padding: 10 },
  muscleImage: { backgroundColor: theme.mediaPlaceholder, borderRadius: 8, minHeight: 150, width: '43%' },
  muscleList: { flex: 1, gap: 8, justifyContent: 'center' },
});
