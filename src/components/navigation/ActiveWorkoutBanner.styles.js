import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const styles = StyleSheet.create({
  banner: {
    backgroundColor: palette.indigo, // Гарний індиго-колір під темну тему
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: palette.whiteTint,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.greenBright, // Зелений індикатор активності
    marginRight: 12,
  },
  title: {
    color: palette.slate50,
    fontSize: 13,
    fontWeight: 'bold',
  },
  subtitle: {
    color: palette.slate300,
    fontSize: 11,
  },
  resumeText: {
    color: palette.whitePure,
    fontWeight: 'bold',
    fontSize: 13,
  },
});
