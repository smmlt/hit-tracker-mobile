import { StyleSheet } from 'react-native';
import { palette } from '../constants/colors';

export const createStyles = (width, height) => {
  const compact = width < 360 || height < 740;
  const contentWidth = Math.min(width, 430) - 28;
  const heroHeight = Math.min(470, contentWidth * 1.17, compact ? height * 0.5 : Infinity);
  const heroTopGap = Math.max(0, Math.min(88, (height - 740) * 0.4));
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: palette.black },
    container: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 14, paddingTop: compact ? 12 : 48, paddingBottom: compact ? 10 : 18 },
    top: { width: '100%', minHeight: compact ? 54 : 82, paddingHorizontal: compact ? 6 : 24, zIndex: 3 },
    progressTrack: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: palette.lightGray },
    progressFill: { height: '100%', borderRadius: 2, backgroundColor: palette.accent },
    skip: { alignSelf: 'flex-end', minHeight: 40, justifyContent: 'center', paddingLeft: 20, marginTop: compact ? 8 : 16 },
    skipText: { color: palette.gray, fontFamily: 'Inter', fontSize: 13 },
    hero: { width: '100%', height: heroHeight, marginTop: heroTopGap, overflow: 'hidden' },
    finalHero: { marginTop: 0 },
    image: { width: '100%', height: '100%' },
    imageStatus: { position: 'absolute', top: '45%', left: 0, right: 0 },
    imageStatusText: { position: 'absolute', top: '45%', left: 12, right: 12, color: palette.gray, fontFamily: 'Inter', fontSize: 13, textAlign: 'center' },
    screenEffects: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 2 },
    blurTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '28%' },
    blurBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '44%' },
    thirdBlurBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' },
    fadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '38%' },
    fadeBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '56%' },
    thirdFadeBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%' },
    content: { width: '100%', paddingHorizontal: 20, paddingTop: compact ? 2 : 8, paddingBottom: compact ? 12 : 22, zIndex: 3 },
    title: { color: palette.accent, fontFamily: 'Inter-Bold', fontSize: compact ? 24 : 26, lineHeight: compact ? 29 : 32, marginBottom: compact ? 10 : 16 },
    description: { color: palette.lightGray, fontFamily: 'Inter-SemiBold', fontSize: 14, lineHeight: 20, maxWidth: 340 },
    error: { color: palette.redSoft, fontFamily: 'Inter', fontSize: 13, textAlign: 'center', marginTop: 8 },
    button: { minHeight: compact ? 44 : 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
    continueButton: { marginHorizontal: 20, zIndex: 3 },
    finalButton: { flex: 1 },
    primary: { backgroundColor: palette.accent },
    outline: { borderWidth: 1, borderColor: palette.whitePure, backgroundColor: palette.transparent },
    primaryText: { color: palette.whitePure, fontFamily: 'Inter', fontSize: 16 },
    secondaryText: { color: palette.whitePure, fontFamily: 'Inter', fontSize: compact ? 14 : 16 },
    finalActions: { flexDirection: 'row', gap: 14, marginHorizontal: 20, zIndex: 3 },
  });
};
