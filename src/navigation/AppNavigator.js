import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';

import { AuthContext } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

import HomeScreen from '../screens/HomeScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ExercisesScreen from '../screens/ExercisesScreen';

const Stack = createNativeStackNavigator();

// Конфігурація для зчитування URL-посилань (Web та Mobile Deep Links)
const linking = {
  prefixes: [Linking.createURL('/'), 'http://localhost:8081', 'hittracker://'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
    },
  },
};

export default function AppNavigator() {
  const { userToken } = useContext(AuthContext);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#F8FAFC',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {userToken === null ? (
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="ForgotPassword" 
              component={ForgotPasswordScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="ResetPassword" 
              component={ResetPasswordScreen} 
              options={{ headerShown: false }} 
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
            <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} options={{ title: 'Active Workout' }} />
            <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Workout History' }} />
            <Stack.Screen name="Exercises" component={ExercisesScreen} options={{ title: 'Exercise Library' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}