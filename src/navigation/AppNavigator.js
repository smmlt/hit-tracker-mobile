import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthContext } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ExercisesScreen from '../screens/ExercisesScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { userToken } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator>
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
              options={{ title: 'Реєстрація' }} 
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: 'Головна' }} 
            />
            <Stack.Screen 
              name="ActiveWorkout" 
              component={ActiveWorkoutScreen} 
              options={{ title: 'Активне тренування' }} 
            />
            <Stack.Screen 
              name="History" 
              component={HistoryScreen} 
              options={{ title: 'Історія тренувань' }} 
            />
            <Stack.Screen 
              name="Exercises" 
              component={ExercisesScreen} 
              options={{ title: 'База вправ' }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}