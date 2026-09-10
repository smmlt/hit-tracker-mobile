import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const createStyles = (theme) => StyleSheet.create({
  backButton: { height: 40, justifyContent: 'center', marginBottom: 16, marginTop: 8, width: 40 },
  inputGroup: { marginBottom: 16 },
  label: { color: theme.textPrimary, fontSize: 14, fontWeight: '500', marginBottom: 8 },
  inputContainer: { alignItems: 'center', backgroundColor: theme.inputBackground, borderColor: theme.border, borderRadius: 12, borderWidth: 1, flexDirection: 'row', height: 50 },
  input: { color: theme.inputText, flex: 1, fontSize: 15, paddingHorizontal: 16 },
  eyeIcon: { paddingHorizontal: 16 },
  primaryButton: { marginBottom: 20, marginTop: 12 },
  socialButton: { alignItems: 'center', backgroundColor: theme.inputBackground, borderColor: theme.border, borderRadius: 12, borderWidth: 1, flexDirection: 'row', height: 50, justifyContent: 'center', marginBottom: 12 },
  socialIcon: { marginRight: 8 },
  socialButtonText: { color: theme.inputText, fontSize: 15, fontWeight: '500' },
  dividerContainer: { alignItems: 'center', marginVertical: 12 },
  dividerText: { color: theme.textSecondary, fontSize: 13 },
});
