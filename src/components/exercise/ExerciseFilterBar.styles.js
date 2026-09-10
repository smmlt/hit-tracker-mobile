import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const createStyles = (theme) => StyleSheet.create({
  container: { marginBottom: 16, width: '100%' },
  rowContainer: { alignItems: 'flex-end', borderBottomColor: theme.border, borderBottomWidth: 1, flexDirection: 'row' },
  chipsCarousel: { flex: 1 },
  chipsContent: { alignItems: 'flex-end', gap: 2, paddingRight: 6 },
  filterChip: {
    alignItems: 'center',
    borderBottomWidth: 4,
    flexDirection: 'row',
    gap: 4,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  chipActive: { borderBottomColor: theme.primary },
  chipInactive: { borderBottomColor: palette.transparent },
  filterChipText: { color: theme.textSecondary, fontFamily: 'Inter', fontSize: 13, fontWeight: '400' },
  filterChipTextActive: { color: theme.primary, fontWeight: '600' },
  menuButton: {
    alignItems: 'center',
    borderRadius: 6,
    flexShrink: 0,
    height: 36,
    justifyContent: 'center',
    marginLeft: 8,
    width: 32,
  },
  modalOverlay: { alignItems: 'center', backgroundColor: palette.overlay55, flex: 1, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: theme.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%', padding: 20, width: '100%' },
  modalTitle: { color: theme.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  gridWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
});
