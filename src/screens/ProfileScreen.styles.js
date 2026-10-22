/**
 * Layout styles used by ProfileScreen, defining its themed spacing, typography, controls, and responsive geometry. / Стилі макета для ProfileScreen, що визначають тематичні відступи, типографіку, елементи керування та адаптивну геометрію.
 */
import { StyleSheet } from 'react-native';
import { contentWidths } from '../constants/layout';

export const createStyles = ({ compact, desktop, horizontalPadding }) => StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingBottom: 34, paddingHorizontal: horizontalPadding },
  page: { maxWidth: contentWidths.form, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: desktop ? 68 : 56 },
  headerButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 42 },
  title: { fontFamily: 'Inter-Bold', fontSize: desktop ? 18 : 16, lineHeight: desktop ? 25 : 22, textTransform: 'uppercase' },
  content: { alignItems: 'center', alignSelf: 'center', maxWidth: desktop ? 560 : 480, paddingTop: desktop ? 28 : 15, width: '100%' },
  avatar: { alignItems: 'center', borderRadius: desktop ? 120 : 108, height: desktop ? 240 : 216, justifyContent: 'center', overflow: 'hidden', width: desktop ? 240 : 216 },
  avatarImage: { height: '100%', width: '100%' },
  name: { fontFamily: 'Inter-SemiBold', fontSize: desktop ? 28 : 24, lineHeight: desktop ? 38 : 34, marginTop: 16, textAlign: 'center' },
  usernameButton: { justifyContent: 'center', minHeight: 34, paddingHorizontal: 16 },
  username: { fontFamily: 'Inter', fontSize: 16, lineHeight: 22 },
  goal: { borderRadius: 10, marginTop: 24, maxWidth: desktop ? 440 : 360, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 12, width: '100%' },
  goalRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  goalBody: { flex: 1 },
  goalText: { fontFamily: 'Inter-Bold', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  goalTrack: { borderRadius: 2, height: 4, marginTop: 7, overflow: 'hidden' },
  goalProgress: { borderRadius: 2, height: 4, width: '34%' },
  bodyMetricsButton: { alignItems: 'center', borderRadius: 11, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, maxWidth: desktop ? 440 : 360, paddingHorizontal: 14, paddingVertical: 13, width: '100%' },
  bodyMetricsButtonText: { fontSize: 14, fontWeight: '800' },
  outlineButton: { alignItems: 'center', alignSelf: 'center', borderRadius: 12, borderWidth: 1, justifyContent: 'center', marginTop: compact ? 48 : 64, maxWidth: desktop ? 440 : 480, minHeight: 46, width: '100%' },
  buttonText: { fontFamily: 'Inter', fontSize: 16 },
  toast: { alignSelf: 'center', borderRadius: 8, bottom: 20, fontFamily: 'Inter', fontSize: 13, paddingHorizontal: 16, paddingVertical: 10, position: 'absolute' },
});
