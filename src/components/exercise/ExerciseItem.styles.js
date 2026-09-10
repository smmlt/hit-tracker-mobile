import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, overflow: "hidden" },
  body: {
    padding: 10,
    minHeight: 123,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  image: { width: 90, height: 90, borderRadius: 8, backgroundColor: palette.imagePlaceholder },
  info: { flex: 1, minWidth: 0, gap: 8 },
  title: { color: palette.white, fontFamily: "Inter-Bold", fontSize: 16, lineHeight: 23 },
  muscleRow: { flexDirection: "row", gap: 5 },
  muscles: { flex: 1, color: palette.lightGray, fontFamily: "Inter", fontSize: 13, lineHeight: 18 },
  more: { color: palette.orange, fontSize: 13 },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  action: { flexDirection: "row", alignItems: "center", gap: 2, minHeight: 36 },
  count: { color: palette.white, fontFamily: "Inter", fontSize: 12 },
  star: {
    width: 32,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    fontFamily: "Inter",
    color: palette.accent,
    borderTopWidth: 1,
    borderTopColor: palette.gray,
    padding: 10,
    textAlign: "center",
    fontSize: 13,
  },
});
