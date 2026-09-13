import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';

export const createStyles = (theme) => StyleSheet.create({
  banner: {
    backgroundColor: theme.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.primary,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.greenBright,
    marginRight: 12,
  },
  title: {
    color: theme.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  subtitle: {
    color: theme.textSecondary,
    fontSize: 11,
  },
  resumeText: {
    color: theme.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
});
