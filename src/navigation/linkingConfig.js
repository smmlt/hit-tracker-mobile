const legacy = (path) => ({ path, exact: true });

export const linkingConfig = {
  screens: {
    Onboarding: 'onboarding',
    Login: { path: 'login', alias: ['auth/google/callback'] },
    Register: 'register',
    VerifyEmail: 'verify-email',
    ForgotPassword: 'forgot-password',
    ResetPassword: 'reset-password',
    SharedExercise: 'share/exercises/:exerciseRef',
    SharedProgram: {
      path: 'share/programs/:programRef/:token',
      alias: [legacy('share/programs/:token')],
    },
    Admin: 'admin',
    Notifications: 'notifications',
    NotFound: '*',
    MainApp: {
      path: '',
      initialRouteName: 'Home',
      screens: {
        History: {
          path: 'history',
          initialRouteName: 'HistoryHome',
          screens: {
            HistoryHome: {
              path: '',
              alias: [legacy('MainApp/History/HistoryHome')],
            },
            HistoryDetails: {
              path: ':date/:workoutRef',
              alias: [legacy('MainApp/History/HistoryDetails')],
            },
          },
        },
        ActiveWorkout: {
          path: 'training',
          initialRouteName: 'TrainingHome',
          screens: {
            TrainingHome: {
              path: ':date?',
              alias: [legacy('MainApp/ActiveWorkout/TrainingHome')],
            },
            ProgramDetails: {
              path: ':date/:assignmentRef',
              alias: [legacy('MainApp/ActiveWorkout/ProgramDetails')],
            },
            WorkoutPreparation: {
              path: 'workout/preparation',
              exact: true,
            },
            WorkoutSession: {
              path: 'active-workout',
              exact: true,
              alias: [legacy('MainApp/ActiveWorkout/WorkoutSession')],
            },
            WorkoutCompleted: {
              path: 'workout/completed/:date/:workoutRef',
              exact: true,
            },
            ExerciseDetails: {
              path: 'exercises/:exerciseRef',
              alias: [legacy('MainApp/ActiveWorkout/ExerciseDetails')],
            },
          },
        },
        Home: {
          path: 'workshop',
          initialRouteName: 'WorkshopHome',
          screens: {
            WorkshopHome: {
              path: '',
              alias: [legacy('MainApp/Home/WorkshopHome')],
            },
            LibraryProgram: {
              path: 'programs/:programRef',
              alias: [legacy('MainApp/Home/LibraryProgram')],
            },
            ExerciseDetails: {
              path: 'exercises/:exerciseRef',
              alias: [legacy('MainApp/Home/ExerciseDetails')],
            },
          },
        },
        Analytics: {
          path: 'analytics',
          initialRouteName: 'AnalyticsHome',
          screens: {
            AnalyticsHome: {
              path: '',
              alias: [legacy('MainApp/Analytics/AnalyticsHome')],
            },
            AnalyticsStrength: { path: 'strength' },
            AnalyticsExercise: { path: 'exercises/:exerciseId' },
            AnalyticsMuscleBalance: { path: 'muscle-balance' },
            AnalyticsIntensity: { path: 'intensity' },
            BodyMetricsDetails: {
              path: 'body-metrics',
              alias: [legacy('MainApp/Analytics/BodyMetricsDetails')],
            },
            AddBodyMeasurement: {
              path: 'body-metrics/new',
              alias: [
                legacy('MainApp/Analytics/AddBodyMeasurement'),
                legacy('MainApp/Profile/AddBodyMeasurement'),
              ],
            },
          },
        },
        Profile: {
          path: 'profile',
          initialRouteName: 'ProfileMain',
          screens: {
            ProfileMain: {
              path: '',
              alias: [legacy('MainApp/Profile/ProfileMain')],
            },
            Settings: {
              path: 'settings',
              alias: [legacy('MainApp/Profile/Settings')],
            },
            EditProfile: {
              path: 'edit',
              alias: [legacy('MainApp/Profile/EditProfile')],
            },
            UsernameSettings: {
              path: 'settings/username',
              alias: [legacy('MainApp/Profile/UsernameSettings')],
            },
          },
        },
      },
    },
  },
};
