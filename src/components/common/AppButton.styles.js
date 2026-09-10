import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 10,
    justifyContent: 'center',
    paddingVertical: 14,
    width: '100%',
  },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.82 },
  label: { color: palette.whitePure, fontSize: 15, fontWeight: '700' },
});
