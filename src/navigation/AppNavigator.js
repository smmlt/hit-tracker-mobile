import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Linking from 'expo-linking';

import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { ActiveWorkoutBanner, AppTabBar } from '../components/navigation';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

import HomeScreen from '../screens/HomeScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ExercisesScreen from '../screens/ExercisesScreen'; 
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ProfileStackNavigator = createNativeStackNavigator();

// ТИМЧАСОВІ ЗАГЛУШКИ ДЛЯ НОВИХ ЕКРАНІВ
const AnalyticsPlaceholder = () => <View style={{flex: 1, backgroundColor: '#101113'}} />;
function ProfileStack() {
  return (
    <ProfileStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNavigator.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStackNavigator.Screen name="Settings" component={SettingsScreen} />
      <ProfileStackNavigator.Screen name="EditProfile" component={EditProfileScreen} />
    </ProfileStackNavigator.Navigator>
  );
}

function MainTabs() {
  const { t } = useContext(LanguageContext);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{ title: t('history') }} 
      />
      <Tab.Screen 
        name="ActiveWorkout" 
        component={ActiveWorkoutScreen} 
        options={{ title: t('activeWorkout') }} 
      />
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: t('home') }} 
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsPlaceholder} 
        options={{ title: t('analytics') }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ title: t('profile') }} 
      />
    </Tab.Navigator>
  );
}

const linking = {
  prefixes: [Linking.createURL('/'), 'http://localhost:8081', 'hittracker://'],
  config: {
    screens: {
      Login: { path: 'login', alias: ['auth/google/callback'] },
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
      <View style={styles.container}>
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
            <Stack.Screen 
              name="MainApp" 
              component={MainTabs} 
              options={{ headerShown: false }} 
            />
          )}
        </Stack.Navigator>

        {userToken !== null && <ActiveWorkoutBanner />}
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
