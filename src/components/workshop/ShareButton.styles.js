import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  busy: { opacity: 0.5 },
  message: {
    backgroundColor: theme.cardBackground,
    padding: 6,
    position: 'absolute',
    right: 0,
    top: 44,
    width: 160,
    zIndex: 10,
  },
});
