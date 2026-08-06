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
  // Отримуємо токен користувача для перевірки стану автентифікації
  const { userToken } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#F8FAFC',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {/* Умова: якщо токен відсутній, показуємо екран авторизації та реєстрації */}
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
              options={{ title: 'Register' }} 
            />
          </>
        ) : (
          /* Якщо користувач увійшов в систему, показуємо головні екрани додатку */
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: 'Home' }} 
            />
            <Stack.Screen 
              name="ActiveWorkout" 
              component={ActiveWorkoutScreen} 
              options={{ title: 'Active Workout' }} 
            />
            <Stack.Screen 
              name="History" 
              component={HistoryScreen} 
              options={{ title: 'Workout History' }} 
            />
            <Stack.Screen 
              name="Exercises" 
              component={ExercisesScreen} 
              options={{ title: 'Exercise Library' }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}