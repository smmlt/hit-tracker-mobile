import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const metadata = () => ({
  appVersion: Constants.expoConfig?.version,
  deviceModel: Device.modelName || undefined,
  locale: Intl.DateTimeFormat().resolvedOptions().locale,
  osVersion: Device.osVersion || undefined,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});

export async function getPushRegistration(requestPermission = false) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      importance: Notifications.AndroidImportance.HIGH,
      name: 'Default',
      sound: 'default',
    });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (requestPermission && permission.status !== 'granted') {
    permission = await Notifications.requestPermissionsAsync();
  }
  if ((Platform.OS === 'ios' && !Device.isDevice) || permission.status !== 'granted') {
    return {
      ...metadata(),
      permissionStatus: permission.status === 'denied' ? 'denied' : 'unknown',
      platform: Platform.OS,
      provider: Platform.OS === 'ios' ? 'expo' : 'fcm',
    };
  }

  const token = Platform.OS === 'ios'
    ? (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data
    : (await Notifications.getDevicePushTokenAsync()).data;
  return {
    ...metadata(),
    permissionStatus: 'granted',
    platform: Platform.OS,
    provider: Platform.OS === 'ios' ? 'expo' : 'fcm',
    token,
  };
}

export function addPushListeners(onOpen, onReceive) {
  const received = Notifications.addNotificationReceivedListener(onReceive);
  const opened = Notifications.addNotificationResponseReceivedListener((response) => {
    onOpen(response.notification.request.content.data?.actionUrl);
  });
  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) onOpen(response.notification.request.content.data?.actionUrl);
  });
  return () => {
    received.remove();
    opened.remove();
  };
}
