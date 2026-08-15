import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { WorkoutProvider } from './src/context/WorkoutContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/localization/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <WorkoutProvider>
            <AppNavigator />
          </WorkoutProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}