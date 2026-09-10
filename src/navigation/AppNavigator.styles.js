import { StyleSheet } from 'react-native';
export const createStyles = (theme) => StyleSheet.create({
  analyticsPlaceholder: { backgroundColor: theme.background, flex: 1 },
  container: { flex: 1 },
  loading: {
    alignItems: 'center',
    backgroundColor: theme.background,
    flex: 1,
    justifyContent: 'center',
  },
});
