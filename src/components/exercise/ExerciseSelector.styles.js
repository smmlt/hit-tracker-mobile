import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const styles = StyleSheet.create({
  filterContainer: { flexDirection: 'row', marginBottom: 10 },
  filterChip: { backgroundColor: palette.slate950, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 6, borderWidth: 1, borderColor: palette.slate700 },
  filterChipActive: { backgroundColor: palette.slate700, borderColor: palette.orangeLegacy },
  filterText: { color: palette.slate400, fontSize: 11, fontWeight: '600' },
  filterTextActive: { color: palette.whitePure },

  container: { flexDirection: 'row', marginBottom: 20 },
  chip: { backgroundColor: palette.slate800, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: palette.slate700, minWidth: 130 },
  chipActive: { backgroundColor: palette.orangeLegacy, borderColor: palette.orangeLegacy },
  chipText: { color: palette.slate300, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: palette.whitePure },
  chipSubText: { color: palette.slate500, fontSize: 10, marginTop: 2 },
  chipSubTextActive: { color: palette.orangePale },
});
