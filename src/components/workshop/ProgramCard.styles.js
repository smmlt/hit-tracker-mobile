import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  info: { flex: 1, gap: 4, minWidth: 0 },
  card: {
    backgroundColor: theme.cardBackground,
    borderLeftWidth: 5,
    borderLeftColor: theme.primary,
    borderRadius: 8,
    overflow: "hidden",
  },
  body: { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  title: { color: theme.textPrimary, fontFamily: "Inter", fontSize: 16, lineHeight: 23 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.background,
  },
  muted: { color: theme.textSecondary, fontFamily: "Inter", fontSize: 13 },
  white: { color: theme.textPrimary, fontFamily: "Inter", fontSize: 13 },
  label: { color: theme.secondary, fontSize: 11, fontWeight: "600" },
  preview: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 4,
  },
  image: { width: 90, height: 90, borderRadius: 8, flexShrink: 0 },
  exercise: { color: theme.textSecondary, fontFamily: "Inter", fontSize: 13, lineHeight: 19 },
  actions: { alignItems: "center", width: 58 },
  like: { flexDirection: "row", alignItems: "center", minHeight: 34, gap: 2 },
});
