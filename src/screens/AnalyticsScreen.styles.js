import { StyleSheet } from 'react-native';

export const createStyles = (theme) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 8,
  },
  selectorWrap: {
    marginBottom: 16,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 50,
    justifyContent: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    maxHeight: 240,
    marginTop: 8,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  dropdownItemText: {
    color: theme.textPrimary,
    fontSize: 14,
  },
  chartCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border,
    minHeight: 340,
    display: 'flex',
    justifyContent: 'center'
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  chartFrame: {
    height: 300,
    position: 'relative',
  },
  xAxisTitle: {
    color: theme.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -4,
  },
  yAxisTitle: {
    color: theme.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    position: 'absolute',
    left: -2,
    top: 112,
    transform: [{ rotate: '-90deg' }],
  },
  loadingText: {
    color: theme.textSecondary,
    fontSize: 14,
    marginTop: 10,
  },
  emptyText: {
    color: theme.textSecondary,
    fontSize: 14,
    marginTop: 10,
  },
});
