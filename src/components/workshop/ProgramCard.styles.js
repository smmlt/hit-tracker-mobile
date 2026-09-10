import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const styles = StyleSheet.create({
  info: { flex: 1, gap: 4, minWidth: 0 },
  card: {
    backgroundColor: palette.surface,
    borderLeftWidth: 5,
    borderLeftColor: palette.accent,
    borderRadius: 8,
    overflow: "hidden",
  },
  body: { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  title: { color: palette.almostWhite, fontFamily: "Inter", fontSize: 16, lineHeight: 23 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: palette.black,
  },
  muted: { color: palette.gray, fontFamily: "Inter", fontSize: 13 },
  white: { color: palette.white, fontFamily: "Inter", fontSize: 13 },
  label: { color: palette.orange, fontSize: 11, fontWeight: "600" },
  preview: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 4,
  },
  exercise: { color: palette.lightGray, fontFamily: "Inter", fontSize: 13, lineHeight: 19 },
  actions: { alignItems: "center", width: 58 },
  like: { flexDirection: "row", alignItems: "center", minHeight: 34, gap: 2 },
});
