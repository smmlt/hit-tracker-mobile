import React, { useContext } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
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
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

import HomeScreen from '../screens/HomeScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import HistoryScreen from '../screens/HistoryScreen';
import HistoryDetailsScreen from '../screens/HistoryDetailsScreen';
import ExerciseDetailsScreen from '../screens/ExerciseDetailsScreen';
import LibraryProgramScreen from '../screens/LibraryProgramScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import UsernameSettingsScreen from '../screens/UsernameSettingsScreen';
import AdminScreen from '../screens/AdminScreen';
import TrainingScreen from '../screens/TrainingScreen';
import ProgramDetailsScreen from '../screens/ProgramDetailsScreen';
import SharedExerciseScreen from '../screens/SharedExerciseScreen';
import SharedProgramScreen from '../screens/SharedProgramScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';

import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import { palette } from '../constants/colors';
import { createStyles } from './AppNavigator.styles';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ProfileStackNavigator = createNativeStackNavigator();
const TrainingStackNavigator = createNativeStackNavigator();
const WorkshopStackNavigator = createNativeStackNavigator();
const HistoryStackNavigator = createNativeStackNavigator();

function HistoryStack() {
  return (
    <HistoryStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <HistoryStackNavigator.Screen name="HistoryHome" component={HistoryScreen} />
      <HistoryStackNavigator.Screen name="HistoryDetails" component={HistoryDetailsScreen} />
    </HistoryStackNavigator.Navigator>
  );
}

function WorkshopStack() {
  return <WorkshopStackNavigator.Navigator screenOptions={{ headerShown: false }}>
    <WorkshopStackNavigator.Screen name="WorkshopHome" component={HomeScreen} />
    <WorkshopStackNavigator.Screen name="LibraryProgram" component={LibraryProgramScreen} />
    <WorkshopStackNavigator.Screen name="ExerciseDetails" component={ExerciseDetailsScreen} />
  </WorkshopStackNavigator.Navigator>;
}
const AnalyticsPlaceholder = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return <View style={styles.analyticsPlaceholder} />;
};
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
      <ProfileStackNavigator.Screen name="UsernameSettings" component={UsernameSettingsScreen} />
    </ProfileStackNavigator.Navigator>
  );
}
function MainTabs() {
  const { t } = useContext(LanguageContext);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      backBehavior="history"
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen 
        name="History" 
        component={HistoryStack}
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
        component={AnalyticsScreen} 
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
  prefixes: [Linking.createURL('/'), 'http://localhost:5173', 'https://app.hit-tracker.com'],
  config: {
    screens: {
      Login: { path: 'login', alias: ['auth/google/callback'] },
      Register: 'register',
      VerifyEmail: 'verify-email',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      SharedExercise: 'share/exercises/:exerciseId',
      SharedProgram: 'share/programs/:token',
    },
  },
};

export default function AppNavigator() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { isInitializing, userData, userToken } = useContext(AuthContext);
  const canOpenAdmin = ['moderator', 'admin', 'super_admin'].includes(userData?.role);

  const [isSkiaReady, setIsSkiaReady] = React.useState(Platform.OS !== 'web');

  const [isAdminRoute] = React.useState(() =>
    Platform.OS === 'web'
      && typeof window !== 'undefined'
      && window.location.pathname.toLowerCase().startsWith('/admin')
  );

  React.useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    let mounted = true;

    LoadSkiaWeb()
      .then(() => {
        if (mounted) {
          setIsSkiaReady(true);
        }
      })
      .catch((error) => {
        console.error('Failed to load Skia on web:', error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!isSkiaReady || isInitializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <View style={styles.container}>
        <Stack.Navigator
          initialRouteName={userToken === null ? 'Login' : isAdminRoute && canOpenAdmin ? 'Admin' : 'MainApp'}
          screenOptions={{
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.textPrimary,
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
                name="VerifyEmail"
                component={VerifyEmailScreen}
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
          ) : isAdminRoute && canOpenAdmin ? (
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
          <Stack.Screen
            name="SharedExercise"
            component={SharedExerciseScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SharedProgram"
            component={SharedProgramScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
}
