import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  overlay: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  menu: { borderRadius: 10, minWidth: 220, overflow: 'hidden', paddingVertical: 4 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 52, paddingHorizontal: 16 },
  divider: { height: StyleSheet.hairlineWidth },
  text: { fontFamily: 'Inter', fontSize: 14 },
});
