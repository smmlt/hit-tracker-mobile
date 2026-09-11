import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  card: { backgroundColor: theme.cardBackground, overflow: "hidden" },
  body: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 107,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  image: { width: 90, height: 90, borderRadius: 8, backgroundColor: theme.border },
  info: { flex: 1, minWidth: 0, gap: 4, paddingVertical: 8 },
  title: { color: theme.textPrimary, fontFamily: "Inter-Bold", fontSize: 16, lineHeight: 23 },
  muscleRow: { flexDirection: "row", gap: 5 },
  muscles: { flex: 1, color: theme.textSecondary, fontFamily: "Inter", fontSize: 13, lineHeight: 18 },
  more: { color: theme.secondary, fontSize: 13 },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  action: { flexDirection: "row", alignItems: "center", gap: 2, minHeight: 36 },
  count: { color: theme.textPrimary, fontFamily: "Inter", fontSize: 12 },
  star: {
    width: 32,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    fontFamily: "Inter",
    color: theme.primary,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    padding: 10,
    textAlign: "center",
    fontSize: 13,
  },
});
