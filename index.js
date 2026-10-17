// EN: Expo entry point that registers the application with the platform runtime.
// UK: Точка входу Expo, що реєструє застосунок у середовищі платформи.
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
