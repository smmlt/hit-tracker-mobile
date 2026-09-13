import { StyleSheet } from 'react-native';
import { palette } from '../../constants/colors';

export const createStyles = (theme) => StyleSheet.create({
  disabled: { opacity: 0.45 },
  dot: { borderRadius: 7, height: 14, width: 14 },
  field: {
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    height: 44,
    justifyContent: 'center',
    width: 55,
  },
  fieldText: { fontFamily: 'Inter-SemiBold', fontSize: 13, marginRight: 2 },
  option: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  optionText: { flex: 1, fontFamily: 'Inter-SemiBold', fontSize: 17, marginLeft: 12 },
  options: { gap: 8, paddingBottom: 4 },
  overlay: { alignItems: 'center', backgroundColor: palette.overlay70, flex: 1, justifyContent: 'center', padding: 24 },
  selected: { borderWidth: 2 },
  sheet: { backgroundColor: theme.cardBackground, borderRadius: 18, maxHeight: '78%', padding: 18, width: '100%', maxWidth: 360 },
  title: { color: theme.textPrimary, fontFamily: 'Inter-Bold', fontSize: 18, marginBottom: 14, textAlign: 'center' },
});
