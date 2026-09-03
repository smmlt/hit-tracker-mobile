import React, { useContext } from 'react';
import { ActivityIndicator, Platform, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as Linking from 'expo-linking';

import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../localization/LanguageContext';
import { AppTabBar } from '../components/navigation';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

import HomeScreen from '../screens/HomeScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ExerciseDetailsScreen from '../screens/ExerciseDetailsScreen';
import LibraryProgramScreen from '../screens/LibraryProgramScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AdminScreen from '../screens/AdminScreen';
import TrainingScreen from '../screens/TrainingScreen';
import ProgramDetailsScreen from '../screens/ProgramDetailsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ProfileStackNavigator = createNativeStackNavigator();
const TrainingStackNavigator = createNativeStackNavigator();
const WorkshopStackNavigator = createNativeStackNavigator();

function WorkshopStack() {
  return <WorkshopStackNavigator.Navigator screenOptions={{ headerShown: false }}>
    <WorkshopStackNavigator.Screen name="WorkshopHome" component={HomeScreen} />
    <WorkshopStackNavigator.Screen name="LibraryProgram" component={LibraryProgramScreen} />
    <WorkshopStackNavigator.Screen name="ExerciseDetails" component={ExerciseDetailsScreen} />
  </WorkshopStackNavigator.Navigator>;
}

const AnalyticsPlaceholder = () => <View style={{flex: 1, backgroundColor: '#101113'}} />;
function TrainingStack() {
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  return (
    <TrainingStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <TrainingStackNavigator.Screen name="TrainingHome" component={TrainingScreen} />
      <TrainingStackNavigator.Screen name="ProgramDetails" component={ProgramDetailsScreen} />
      <TrainingStackNavigator.Screen name="WorkoutSession" component={ActiveWorkoutScreen}
        options={{ contentStyle: { paddingBottom: tabBarHeight, backgroundColor: theme.background } }} />
      <TrainingStackNavigator.Screen name="ExerciseDetails" component={ExerciseDetailsScreen} />
    </TrainingStackNavigator.Navigator>
  );
}
function ProfileStack() {
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  return (
    <ProfileStackNavigator.Navigator screenOptions={{ headerShown: false,
      contentStyle: { paddingBottom: tabBarHeight, backgroundColor: theme.background } }}>
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
        component={TrainingStack}
        options={{ title: t('training') || 'Training' }}
      />
      <Tab.Screen 
        name="Home" 
        component={WorkshopStack}
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
  prefixes: [Linking.createURL('/'), 'http://localhost:5173'],
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
  const { isLoading, userToken } = useContext(AuthContext);
  const [isAdminRoute] = React.useState(() => Platform.OS === 'web'
    && typeof window !== 'undefined'
    && window.location.pathname.toLowerCase().startsWith('/admin'));

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

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
          ) : isAdminRoute ? (
            <Stack.Screen
              name="Admin"
              component={AdminScreen}
              options={{ headerShown: false }}
            />
          ) : (
            <Stack.Screen 
              name="MainApp" 
              component={MainTabs} 
              options={{ headerShown: false }} 
            />
          )}
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    flex: 1,
    justifyContent: 'center',
  },
});
