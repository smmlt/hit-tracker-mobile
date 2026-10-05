import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  safeArea: {
    alignItems: 'center',
    backgroundColor: theme.background,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: theme.cardBackground,
    borderColor: theme.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 16,
    maxWidth: 520,
    padding: 28,
    width: '100%',
  },
  eyebrow: { color: theme.error, fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: theme.textPrimary, fontSize: 28, fontWeight: '900' },
  message: { color: theme.textSecondary, fontSize: 15, lineHeight: 22 },
  detail: { borderColor: theme.border, borderRadius: 14, borderWidth: 1, gap: 5, padding: 14 },
  label: { color: theme.textSecondary, fontSize: 12 },
  value: { color: theme.textPrimary, fontSize: 15, fontWeight: '700' },
  hint: { color: theme.textSecondary, fontSize: 12, lineHeight: 18 },
});
