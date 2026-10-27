// EN: Builds the public and authenticated navigation trees, nested tabs/stacks, deep-link handling, and global workout return banner.
// UK: Будує публічне й авторизоване дерева навігації, вкладені tabs/stacks, deep links і глобальний банер повернення до тренування.
// EN: Auth state selects the public or authenticated root; authenticated routes are grouped into nested tabs/stacks and deep links enter through linkingConfig.
// UK: Стан автентифікації обирає публічний або захищений корінь; захищені маршрути згруповані у вкладені tab/stack, а deep link-и проходять через linkingConfig.
import React, { useContext } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
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
import MfaScreen from '../screens/MfaScreen';

import HomeScreen from '../screens/HomeScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import HistoryScreen from '../screens/HistoryScreen';
import HistoryDetailsScreen from '../screens/HistoryDetailsScreen';
import ExerciseDetailsScreen from '../screens/ExerciseDetailsScreen';
import LibraryProgramScreen from '../screens/LibraryProgramScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MediaSourcesScreen from '../screens/MediaSourcesScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import UsernameSettingsScreen from '../screens/UsernameSettingsScreen';
import AdminScreen from '../screens/AdminScreen';
import TrainingScreen from '../screens/TrainingScreen';
import ProgramDetailsScreen from '../screens/ProgramDetailsScreen';
import SharedExerciseScreen from '../screens/SharedExerciseScreen';
import SharedProgramScreen from '../screens/SharedProgramScreen';
import AnalyticsScreen from '../screens/AnalyticsDashboardScreen';
import AnalyticsStrengthScreen from '../screens/AnalyticsStrengthListScreen';
import AnalyticsExerciseScreen from '../screens/AnalyticsExerciseDetailScreen';
import AnalyticsMuscleBalanceScreen from '../screens/AnalyticsMuscleDetailScreen';
import AnalyticsIntensityScreen from '../screens/AnalyticsIntensityScreen';
import BodyMetricsDetailsScreen from '../screens/BodyMetricsDetailsScreen';
import AddBodyMeasurementScreen from '../screens/AddBodyMeasurementScreen';
import NotFoundScreen from '../screens/NotFoundScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AccountSuspendedScreen from '../screens/AccountSuspendedScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

import { palette } from '../constants/colors';
import { WEB_APP_URL } from '../utils/shareLinks';
import { createStyles } from './AppNavigator.styles';
import { linkingConfig } from './linkingConfig';
import { addPushListeners } from '../services/notificationService';
import { safeNotificationUrl } from '../utils/safeNotificationUrl';
import { AnalyticsPeriodProvider } from '../context/AnalyticsPeriodContext';
const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();
const Tab = createBottomTabNavigator();
const ProfileStackNavigator = createNativeStackNavigator();
const TrainingStackNavigator = createNativeStackNavigator();
const WorkshopStackNavigator = createNativeStackNavigator();
const HistoryStackNavigator = createNativeStackNavigator();
const AnalyticsStackNavigator = createNativeStackNavigator();

// EN: Groups the history list and workout-detail views so the History tab preserves its own back stack.
// UK: Групує список історії та деталі тренування, щоб вкладка History зберігала власний back stack.
function HistoryStack() {
  return (
    <HistoryStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <HistoryStackNavigator.Screen name="HistoryHome" component={HistoryScreen} />
      <HistoryStackNavigator.Screen name="HistoryDetails" component={HistoryDetailsScreen} />
    </HistoryStackNavigator.Navigator>
  );
}

// EN: Shares one analytics period across overview and drill-down screens while keeping content above the bottom tab bar.
// UK: Надає один analytics period для overview і drill-down екранів та утримує контент над нижньою tab bar.
function AnalyticsStack() {
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  return (
    <AnalyticsPeriodProvider>
      <AnalyticsStackNavigator.Navigator
        initialRouteName="AnalyticsHome"
        screenOptions={{
          headerShown: false,
          contentStyle: {
            paddingBottom: tabBarHeight,
            backgroundColor: theme.background,
          },
        }}
      >
        <AnalyticsStackNavigator.Screen name="AnalyticsHome" component={AnalyticsScreen} />
        <AnalyticsStackNavigator.Screen name="AnalyticsIntensity" component={AnalyticsIntensityScreen} />
        <AnalyticsStackNavigator.Screen name="AnalyticsMuscleBalance" component={AnalyticsMuscleBalanceScreen} />
        <AnalyticsStackNavigator.Screen name="AnalyticsStrength" component={AnalyticsStrengthScreen} />
        <AnalyticsStackNavigator.Screen name="AnalyticsExercise" component={AnalyticsExerciseScreen} />
        <AnalyticsStackNavigator.Screen name="BodyMetricsDetails" component={BodyMetricsDetailsScreen} />
        <AnalyticsStackNavigator.Screen name="AddBodyMeasurement" component={AddBodyMeasurementScreen} />
      </AnalyticsStackNavigator.Navigator>
    </AnalyticsPeriodProvider>
  );
}

// EN: Keeps Workshop browsing, program details, and exercise details in one independently navigable tab stack.
// UK: Об'єднує Workshop, деталі програми й вправи в окремий навігаційний stack вкладки.
function WorkshopStack() {
  return (
    <WorkshopStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <WorkshopStackNavigator.Screen name="WorkshopHome" component={HomeScreen} />
      <WorkshopStackNavigator.Screen name="LibraryProgram" component={LibraryProgramScreen} />
      <WorkshopStackNavigator.Screen name="ExerciseDetails" component={ExerciseDetailsScreen} />
    </WorkshopStackNavigator.Navigator>
  );
}
// EN: Supplies an empty themed surface while analytics content is being prepared or replaced.
// UK: Показує порожню тематизовану поверхню, доки analytics-контент готується або замінюється.
const AnalyticsPlaceholder = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return <View style={styles.analyticsPlaceholder} />;
};
// EN: Groups training preparation, active session, completion, program, and exercise routes under the Training tab.
// UK: Групує routes підготовки, активної сесії, завершення, програми та вправ під вкладкою Training.
function TrainingStack() {
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  return (
    <TrainingStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <TrainingStackNavigator.Screen name="TrainingHome" component={TrainingScreen} />
      <TrainingStackNavigator.Screen name="ProgramDetails" component={ProgramDetailsScreen} />
      <TrainingStackNavigator.Screen
        name="WorkoutPreparation"
        component={ActiveWorkoutScreen}
        options={{
          contentStyle: {
            paddingBottom: tabBarHeight,
            backgroundColor: theme.background,
          },
        }}
      />
      <TrainingStackNavigator.Screen
        name="WorkoutSession"
        component={ActiveWorkoutScreen}
        options={{
          contentStyle: {
            paddingBottom: tabBarHeight,
            backgroundColor: theme.background,
          },
        }}
      />
      <TrainingStackNavigator.Screen
        name="WorkoutCompleted"
        component={ActiveWorkoutScreen}
        options={{
          contentStyle: {
            paddingBottom: tabBarHeight,
            backgroundColor: theme.background,
          },
        }}
      />
      <TrainingStackNavigator.Screen name="ExerciseDetails" component={ExerciseDetailsScreen} />
    </TrainingStackNavigator.Navigator>
  );
}
// EN: Groups profile and account-setting screens while applying consistent tab-bar spacing and theme colors.
// UK: Групує профіль і налаштування акаунта та застосовує узгоджені відступи tab bar і кольори теми.
function ProfileStack() {
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  return (
    <ProfileStackNavigator.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          paddingBottom: tabBarHeight,
          backgroundColor: theme.background,
        },
      }}
    >
      <ProfileStackNavigator.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStackNavigator.Screen name="Settings" component={SettingsScreen} />
      <ProfileStackNavigator.Screen name="MediaSources" component={MediaSourcesScreen} />
      <ProfileStackNavigator.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStackNavigator.Screen name="UsernameSettings" component={UsernameSettingsScreen} />
    </ProfileStackNavigator.Navigator>
  );
}
// EN: Creates the five authenticated bottom tabs and translates their visible labels without changing stable route names.
// UK: Створює п'ять авторизованих нижніх вкладок і перекладає їх labels, не змінюючи стабільні route names.
function MainTabs() {
  const { t } = useContext(LanguageContext);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      backBehavior="history"
      tabBar={
        /* EN: Delegates rendering to the project's custom tab bar while forwarding React Navigation state and actions. */
        /* UK: Передає rendering власній tab bar проєкту разом зі state та actions від React Navigation. */
        (props) => <AppTabBar {...props} />
      }
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="History" component={HistoryStack} options={{ title: t('history') }} />
      <Tab.Screen name="ActiveWorkout" component={TrainingStack} options={{ title: t('training') }} />
      <Tab.Screen name="Home" component={WorkshopStack} options={{ title: t('home') }} />
      <Tab.Screen name="Analytics" component={AnalyticsStack} options={{ title: t('analytics') }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ title: t('profile') }} />
    </Tab.Navigator>
  );
}

const linking = {
  prefixes: [Linking.createURL('/'), 'http://localhost:5173', WEB_APP_URL],
  config: linkingConfig,
};

// EN: Chooses the root navigation branch from initialization, onboarding, suspension, MFA, session, and admin state.
// UK: Обирає кореневу гілку navigation за станами initialization, onboarding, suspension, MFA, session та admin.
export default function AppNavigator({ onOnboardingComplete, showOnboarding = false }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { accountSuspension, isInitializing, pendingMfa, userData, userToken } = useContext(AuthContext);
  const canOpenAdmin = ['moderator', 'admin', 'super_admin'].includes(userData?.role);
  const pendingNotificationOpen = React.useRef(false);

  const openNotifications = React.useCallback(
    /* EN: Opens a validated notification deep link, or queues the inbox until the navigation container becomes ready. */
    /* UK: Відкриває перевірений notification deep link або ставить inbox у чергу до готовності navigation container. */
    (actionUrl) => {
      if (!userToken) return;
      const safeActionUrl = safeNotificationUrl(actionUrl);
      if (safeActionUrl) {
        void Linking.openURL(safeActionUrl);
        return;
      }
      if (navigationRef.isReady()) navigationRef.navigate('Notifications');
      else pendingNotificationOpen.current = true;
    },
    [userToken],
  );

  React.useEffect(
    /* EN: Subscribes to push interactions only for an authenticated session and returns the listener cleanup function. */
    /* UK: Підписується на push-взаємодії лише для авторизованої сесії та повертає функцію cleanup listeners. */
    () => {
    if (!userToken) return undefined;
    return addPushListeners(
      openNotifications,
      /* EN: Intentionally ignores foreground receipt here because the inbox screen fetches authoritative server state. */
      /* UK: Навмисно ігнорує foreground receipt тут, бо inbox-екран читає авторитетний серверний стан. */
      () => {}
    );
    },
    [openNotifications, userToken]
  );

  const [isAdminRoute] = React.useState(
    /* EN: Captures the initial web URL once so a direct /admin load can select the admin root without reacting to later path changes. */
    /* UK: Один раз фіксує початковий web URL, щоб пряме відкриття /admin обрало admin-root без реакції на подальші зміни path. */
    () => Platform.OS === 'web' && typeof window !== 'undefined' && window.location.pathname.toLowerCase().startsWith('/admin')
  );
  const rootState = showOnboarding
    ? 'onboarding'
    : accountSuspension
      ? 'suspended'
      : userToken === null
        ? pendingMfa ? 'mfa' : 'public'
        : isAdminRoute && canOpenAdmin ? 'admin' : 'authenticated';

  if (isInitializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      linking={linking}
      ref={navigationRef}
      onReady={
        /* EN: Replays a queued notification navigation after the container can safely accept route actions. */
        /* UK: Повторює відкладену notification-навігацію після готовності container приймати route actions. */
        () => {
        if (pendingNotificationOpen.current) {
          pendingNotificationOpen.current = false;
          navigationRef.navigate('Notifications');
        }
        }
      }
    >
      <View style={styles.container}>
        <Stack.Navigator
          key={rootState}
          initialRouteName={showOnboarding ? 'Onboarding' : accountSuspension ? 'AccountSuspended' : userToken === null ? (pendingMfa ? 'Mfa' : 'Login') : isAdminRoute && canOpenAdmin ? 'Admin' : 'MainApp'}
          screenOptions={{
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.textPrimary,
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          {showOnboarding ? <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
            {
              /* EN: Injects the application-level completion callback into the routed onboarding screen. */
              /* UK: Передає application-level callback завершення у routed onboarding-екран. */
              (props) => <OnboardingScreen {...props} onComplete={onOnboardingComplete} />
            }
          </Stack.Screen> : null}
          {accountSuspension ? (
            <Stack.Screen name="AccountSuspended" component={AccountSuspendedScreen} options={{ headerShown: false }} />
          ) : userToken === null ? (
            pendingMfa ? (
              <Stack.Screen name="Mfa" component={MfaScreen} options={{ headerShown: false }} />
            ) : (
              <>
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
              </>
            )
          ) : (
            <>
              <Stack.Screen name="MainApp" component={MainTabs} options={{ headerShown: false }} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
              {canOpenAdmin && (
                <Stack.Screen name="Admin" component={AdminScreen} options={{ headerShown: false }} />
              )}
            </>
          )}
          <Stack.Screen name="SharedExercise" component={SharedExerciseScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SharedProgram" component={SharedProgramScreen} options={{ headerShown: false }} />
          <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
}
