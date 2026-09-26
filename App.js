import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthContext, AuthProvider } from './src/context/AuthContext';
import { WorkoutProvider } from './src/context/WorkoutContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/localization/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import { LibraryProvider } from './src/context/LibraryContext';
import { palette } from './src/constants/colors';
import { useFonts } from 'expo-font';

const STARTUP_ANIMATION_MS = 900;
const LOGO_SIZE = 172;
const WORDMARK_ASPECT_RATIO = 690 / 68;
const LETTER_BOUNDS = [
  [0, 67],
  [82, 116],
  [140, 206],
  [266, 333],
  [350, 422],
  [446, 518],
  [541, 603],
  [621, 690],
];

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
  SplashScreen.setOptions({ duration: 0, fade: false });
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter: require('./src/assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('./src/assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('./src/assets/fonts/Inter-Bold.ttf'),
  });

  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <WorkoutProvider>
            <LibraryProvider>
              <AppContent fontsReady={fontsLoaded || Boolean(fontError)} />
            </LibraryProvider>
          </WorkoutProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

function AppContent({ fontsReady }) {
  const { isInitializing } = useContext(AuthContext);
  const nativeSplashHidden = useRef(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  const handleBrandLayout = useCallback(() => {
    if (nativeSplashHidden.current) return;
    nativeSplashHidden.current = true;
    void SplashScreen.hideAsync();
    setAnimationStarted(true);
  }, []);
  const handleAnimationComplete = useCallback(() => setAnimationComplete(true), []);

  if (Platform.OS === 'web') {
    return fontsReady ? <AppNavigator /> : null;
  }

  if (fontsReady && animationComplete && !isInitializing) {
    return <AppNavigator />;
  }

  return (
    <StartupSplash
      animationStarted={animationStarted}
      onAnimationComplete={handleAnimationComplete}
      onLayout={handleBrandLayout}
    />
  );
}

function StartupSplash({ animationStarted, onAnimationComplete, onLayout }) {
  const { width } = useWindowDimensions();
  const letterProgress = useRef(LETTER_BOUNDS.map(() => new Animated.Value(0))).current;
  const wordmarkWidth = Math.min(250, Math.max(210, width * 0.6));
  const wordmarkHeight = wordmarkWidth / WORDMARK_ASPECT_RATIO;
  const wordmarkScale = wordmarkWidth / 690;
  const logoVisibleTop = (154 / 1024) * LOGO_SIZE - LOGO_SIZE / 2;
  const wordmarkTop = -logoVisibleTop - wordmarkHeight;

  useEffect(() => {
    if (!animationStarted) return undefined;

    const letterAnimations = letterProgress.map((progress) =>
      Animated.timing(progress, {
        duration: 160,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      })
    );
    const animation = Animated.sequence([
      Animated.delay(80),
      Animated.stagger(80, letterAnimations),
      Animated.delay(STARTUP_ANIMATION_MS - 800),
    ]);

    animation.start(({ finished }) => {
      if (finished) onAnimationComplete();
    });

    return () => animation.stop();
  }, [animationStarted, letterProgress, onAnimationComplete]);

  return (
    <View onLayout={onLayout} style={styles.startupSplash}>
      <StatusBar style="light" backgroundColor={palette.accent} />
      <Image
        resizeMode="contain"
        source={require('./assets/splash-native-logo.png')}
        style={styles.startupLogo}
      />
      <View
        style={[
          styles.wordmarkPosition,
          {
            height: wordmarkHeight,
            marginLeft: -wordmarkWidth / 2,
            marginTop: wordmarkTop,
            width: wordmarkWidth,
          },
        ]}
      >
        {LETTER_BOUNDS.map(([start, end], index) => (
          <Animated.View
            key={`${start}-${end}`}
            style={[
              styles.letterSlot,
              {
                left: start * wordmarkScale,
                opacity: letterProgress[index],
                transform: [
                  {
                    translateY: letterProgress[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [6, 0],
                    }),
                  },
                ],
                width: (end - start) * wordmarkScale,
              },
            ]}
          >
            <Image
              resizeMode="stretch"
              source={require('./assets/splash-wordmark.png')}
              style={{
                height: wordmarkHeight,
                left: -start * wordmarkScale,
                position: 'absolute',
                width: wordmarkWidth,
              }}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  startupSplash: {
    backgroundColor: palette.accent,
    flex: 1,
  },
  startupLogo: {
    height: LOGO_SIZE,
    left: '50%',
    marginLeft: -LOGO_SIZE / 2,
    marginTop: -LOGO_SIZE / 2,
    position: 'absolute',
    top: '50%',
    width: LOGO_SIZE,
  },
  wordmarkPosition: {
    left: '50%',
    position: 'absolute',
    top: '50%',
  },
  letterSlot: {
    height: '100%',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
  },
});
