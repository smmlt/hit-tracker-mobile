import React, { useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Easing, Image, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { API_URL } from '../constants/config';
import { palette } from '../constants/colors';
import { ONBOARDING_COMPLETED_KEY, ONBOARDING_COMPLETED_VALUE } from '../utils/onboarding';
import { createStyles } from './OnboardingScreen.styles';

const pages = [
  { image: '/onboarding/goal', title: 'onboardingGoalTitle', description: 'onboardingGoalDescription' },
  { image: '/onboarding/progress', title: 'onboardingProgressTitle', description: 'onboardingProgressDescription' },
  { image: '/onboarding/community', title: 'onboardingCommunityTitle', description: 'onboardingCommunityDescription' },
];

export default function OnboardingScreen({ navigation, onComplete }) {
  const { height, width } = useWindowDimensions();
  const { userToken } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [index, setIndex] = useState(0);
  const [imageUri, setImageUri] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [error, setError] = useState('');
  const progress = useRef(new Animated.Value(0)).current;
  const thirdOverlayOpacity = useRef(new Animated.Value(1)).current;
  const reducedMotion = useRef(false);
  const styles = createStyles(width, height);
  const page = pages[index];

  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled?.().then((value) => { reducedMotion.current = value; }); }, []);
  useEffect(() => {
    const target = (index + 1) / pages.length;
    const animation = Animated.timing(progress, {
      toValue: target,
      duration: reducedMotion.current ? 0 : 700,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [index, progress]);

  useEffect(() => {
    if (index !== pages.length - 1) {
      thirdOverlayOpacity.setValue(1);
      return undefined;
    }
    thirdOverlayOpacity.setValue(0);
    const animation = Animated.timing(thirdOverlayOpacity, {
      toValue: 1,
      duration: reducedMotion.current ? 0 : 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [index, thirdOverlayOpacity]);

  useEffect(() => {
    let cancelled = false;
    setImageUri(null);
    setImageFailed(false);
    fetch(`${API_URL}${page.image}`)
      .then((response) => {
        if (!response.ok) throw new Error('Image URL request failed');
        return response.json();
      })
      .then(({ url }) => {
        if (!cancelled && url) setImageUri(url);
        else if (!cancelled) setImageFailed(true);
      })
      .catch(() => { if (!cancelled) setImageFailed(true); });
    return () => { cancelled = true; };
  }, [page.image]);

  const complete = async (route) => {
    setError('');
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, ONBOARDING_COMPLETED_VALUE);
      onComplete?.();
      navigation.replace(route || (userToken ? 'MainApp' : 'Login'));
    } catch (storageError) {
      setError(t('onboardingSaveError'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.top}>
          <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityLabel={`${index + 1} of ${pages.length}`}>
            <Animated.View style={[styles.progressFill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
          </View>
          {index < pages.length - 1 ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t('skip')} onPress={() => complete(userToken ? 'MainApp' : 'Login')} style={styles.skip}>
              <Text style={styles.skipText}>{t('skip')}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.hero, index === pages.length - 1 && styles.finalHero]}>
          {imageUri && !imageFailed ? <Image accessibilityIgnoresInvertColors accessibilityLabel={t(page.title)} onError={() => setImageFailed(true)} source={{ uri: imageUri }} resizeMode="cover" style={styles.image} /> : null}
          {!imageUri && !imageFailed ? <ActivityIndicator color={palette.accent} style={styles.imageStatus} /> : null}
          {imageFailed ? <Text role="alert" style={styles.imageStatusText}>{t('onboardingImageError')}</Text> : null}
        </View>

        {index === pages.length - 1 ? (
          <Animated.View pointerEvents="none" style={[styles.screenEffects, { opacity: thirdOverlayOpacity }]}>
            <BlurView intensity={16} tint="dark" style={styles.blurTop} />
            <BlurView intensity={20} tint="dark" style={styles.thirdBlurBottom} />
            <LinearGradient colors={[palette.blackPure, palette.transparent]} style={styles.fadeTop} />
            <LinearGradient colors={[palette.transparent, palette.blackPure]} style={styles.thirdFadeBottom} />
          </Animated.View>
        ) : (
          <View pointerEvents="none" style={styles.screenEffects}>
            <BlurView intensity={18} tint="dark" style={styles.blurBottom} />
            <LinearGradient colors={[palette.transparent, palette.blackPure]} style={styles.fadeBottom} />
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{t(page.title)}</Text>
          <Text style={styles.description}>{t(page.description)}</Text>
          {error ? <Text role="alert" style={styles.error}>{error}</Text> : null}
        </View>

        {index === pages.length - 1 ? (
          <View style={styles.finalActions}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('onboardingSignIn')} onPress={() => complete(userToken ? 'MainApp' : 'Login')} style={[styles.button, styles.finalButton, styles.primary]}>
              <Text style={styles.primaryText}>{t('onboardingSignIn')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('onboardingSignUp')} onPress={() => complete('Register')} style={[styles.button, styles.finalButton, styles.outline]}>
              <Text style={styles.secondaryText}>{t('onboardingSignUp')}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable accessibilityRole="button" accessibilityLabel={t('continue')} onPress={() => setIndex(index + 1)} style={[styles.button, styles.primary, styles.continueButton]}>
            <Text style={styles.primaryText}>{t('continue')}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
