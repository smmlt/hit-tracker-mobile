import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  overlay: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  menu: { borderRadius: 10, gap: 10, minWidth: 181, padding: 12 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'center', minHeight: 24 },
  divider: { height: StyleSheet.hairlineWidth, width: '100%' },
  text: { fontFamily: 'Inter', fontSize: 16, lineHeight: 22 },
});
