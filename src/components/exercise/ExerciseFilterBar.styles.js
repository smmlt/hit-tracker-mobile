import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  container: { marginBottom: 16, width: '100%' },
  rowContainer: { alignItems: 'center', flexDirection: 'row' },
  chipsCarousel: { flex: 1 },
  chipsContent: { alignItems: 'center', gap: 6, paddingRight: 6 },
  filterChip: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  chipActive: { backgroundColor: theme.filterChipActiveBackground },
  chipInactive: { backgroundColor: theme.filterChipBackground },
  filterChipText: { color: theme.filterChipText, fontFamily: 'Roboto', fontSize: 12, fontWeight: '400' },
  filterChipTextActive: { color: theme.filterChipActiveText, fontWeight: '500' },
  menuButton: {
    alignItems: 'center',
    borderRadius: 14,
    flexShrink: 0,
    height: 28,
    justifyContent: 'center',
    marginLeft: 8,
    width: 28,
  },
  modalOverlay: { alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.55)', flex: 1, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: theme.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%', padding: 20, width: '100%' },
  modalTitle: { color: theme.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  gridWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
});
