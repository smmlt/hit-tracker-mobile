import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { WorkoutProvider } from './src/context/WorkoutContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/localization/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import { LibraryProvider } from './src/context/LibraryContext';
import { useFonts } from 'expo-font';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter: require('./src/assets/fonts/Inter-Regular.ttf'),
    'Inter-SemiBold': require('./src/assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('./src/assets/fonts/Inter-Bold.ttf'),
  });
  if (!fontsLoaded && !fontError) return null;
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
