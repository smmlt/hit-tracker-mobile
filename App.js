import React, { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { WorkoutProvider } from './src/context/WorkoutContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/localization/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import { LibraryProvider } from './src/context/LibraryContext';
import { useFonts } from 'expo-font';

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter: require('./src/assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('./src/assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('./src/assets/fonts/Inter-Bold.ttf'),
  });
  const [showBrandSplash, setShowBrandSplash] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS !== 'web' && (fontsLoaded || fontError)) {
      SplashScreen.hide();
      const timer = setTimeout(() => setShowBrandSplash(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;
  if (showBrandSplash) {
    return (
      <View style={styles.brandSplash}>
        <StatusBar style="light" backgroundColor="#EE1C27" />
        <Image source={require('./assets/splash-brand.png')} resizeMode="contain" style={styles.brandImage} />
      </View>
    );
  }
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <WorkoutProvider>
            <LibraryProvider><AppNavigator /></LibraryProvider>
          </WorkoutProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  brandSplash: {
    alignItems: 'center',
    backgroundColor: '#EE1C27',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  brandImage: {
    height: '55%',
    maxWidth: 420,
    width: '100%',
  },
});
