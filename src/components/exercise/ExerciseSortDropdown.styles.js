import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const createStyles = (theme) => StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    zIndex: 10,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  text: {
    color: theme.inputText,
    fontSize: 14,
    fontWeight: '400',
  },
  boldText: {
    fontWeight: '600',
    color: theme.inputText,
  },
  icon: {
    marginLeft: 8,
    transform: [{ rotate: '0deg' }],
  },
  iconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: palette.transparent,
  },
  dropdownMenu: {
    position: 'absolute',
    width: 200,
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    paddingVertical: 6,
    elevation: 6,
    shadowColor: palette.blackPure,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: theme.border,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionItemActive: {
    backgroundColor: theme.primary + '20',
  },
  optionText: {
    fontSize: 14,
    color: theme.inputText,
    fontWeight: '400',
  },
  optionTextActive: {
    fontWeight: 'bold',
    color: theme.primary,
  },
});
