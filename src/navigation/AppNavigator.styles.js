// EN: Creates theme-aware layout styles used by the root navigator, loading state, tab shell, and workout banner.
// UK: Створює залежні від теми стилі кореневої навігації, loading state, оболонки вкладок і workout-банера.
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
