import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 2000,
    maxWidth: '90%',
  width: '90%',
  },
  toastWeb: { bottom: 24, left: '5%', position: 'fixed', right: '5%', width: 'auto', zIndex: 9999 },

  // Default dark presentation for the main application.
  toastSuccess: { backgroundColor: palette.success, elevation: 6 },
  toastError: { backgroundColor: palette.red, elevation: 6 },
  textDark: { color: palette.whitePure },

  // Light presentation for authentication screens.
  toastLight: {
    backgroundColor: palette.whitePure,
    borderWidth: 1,
    shadowColor: palette.blackPure,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  borderError: { borderColor: palette.redBorder },
  borderSuccess: { borderColor: palette.greenBorder },
  textErrorLight: { color: palette.red700 },
  textSuccessLight: { color: palette.greenDarkText },
  closeTextLight: { color: palette.gray500 },

  // Shared toast styles.
  toastText: { fontSize: 14, fontWeight: '600', flex: 1, marginRight: 12 },
  toastClose: { padding: 4 },
  toastCloseText: { fontSize: 14, fontWeight: 'bold', color: palette.whitePure },
});
