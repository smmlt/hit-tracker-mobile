import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    height: 44,
    paddingHorizontal: 12,
  },
  input: {
    color: '#121111',
    flex: 1,
    fontSize: 14,
    height: '100%',
    marginLeft: 8,
    outlineStyle: Platform.OS === 'web' ? 'none' : undefined,
    padding: 0,
  },
});
