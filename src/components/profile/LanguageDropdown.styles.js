// EN: Defines theme-token-only geometry and visual states for the anchored language dropdown.
// UK: Визначає геометрію та візуальні стани прив'язаного меню мов лише через токени теми.

import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  wrapper: { alignSelf: 'flex-start', maxWidth: 360, width: '100%' },
  trigger: {
    alignItems: 'center',
    borderColor: theme.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  value: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10, minWidth: 0 },
  valueText: { color: theme.textPrimary, flexShrink: 1, fontFamily: 'Inter', fontSize: 16 },
  flagFrame: {
    alignItems: 'center',
    borderRadius: 2,
    height: 16,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 24,
  },
  modal: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject },
  menu: {
    backgroundColor: theme.surfaceElevated,
    borderColor: theme.border,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 8,
    overflow: 'hidden',
    position: 'absolute',
    shadowColor: theme.textPrimary,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  menuContent: { paddingVertical: 6 },
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  optionSelected: { backgroundColor: theme.primary },
  optionText: { color: theme.textPrimary, flex: 1, fontFamily: 'Inter', fontSize: 16 },
  optionTextSelected: { color: theme.onPrimary, fontFamily: 'Inter-SemiBold' },
  checkSpacer: { height: 20, width: 20 },
  pressed: { opacity: 0.7 },
});
