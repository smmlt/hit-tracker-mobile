import { StyleSheet } from 'react-native';

import { palette } from '../../constants/colors';
export const styles = StyleSheet.create({
  backButton: { height: 40, justifyContent: 'center', marginBottom: 16, marginTop: 8, width: 40 },
  inputGroup: { marginBottom: 16 },
  label: { color: palette.blackPure, fontSize: 14, fontWeight: '500', marginBottom: 8 },
  inputContainer: { alignItems: 'center', backgroundColor: palette.whitePure, borderColor: palette.gray300, borderRadius: 12, borderWidth: 1, flexDirection: 'row', height: 50 },
  input: { color: palette.blackPure, flex: 1, fontSize: 15, paddingHorizontal: 16 },
  eyeIcon: { paddingHorizontal: 16 },
  primaryButton: { marginBottom: 20, marginTop: 12 },
  socialButton: { alignItems: 'center', backgroundColor: palette.whitePure, borderColor: palette.gray300, borderRadius: 12, borderWidth: 1, flexDirection: 'row', height: 50, justifyContent: 'center', marginBottom: 12 },
  socialIcon: { marginRight: 8 },
  socialButtonText: { color: palette.blackPure, fontSize: 15, fontWeight: '500' },
  dividerContainer: { alignItems: 'center', marginVertical: 12 },
  dividerText: { color: palette.gray600, fontSize: 13 },
});
