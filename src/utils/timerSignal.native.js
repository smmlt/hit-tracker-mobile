// EN: Schedules a sound when a timed set ends even while the device is locked, and vibrates in the foreground.
// UK: Планує звук завершення підходу навіть на заблокованому пристрої та вібрує у відкритому застосунку.
import { AppState, Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';

/** EN: Native sound is provided by the scheduled notification. UK: На пристрої звук відтворює заплановане сповіщення. */
export function prepareTimerSignal() {}

/** EN: Schedules one local alarm for the remaining wall-clock time when notification permission allows it. UK: Планує один локальний сигнал на залишок реального часу, якщо дозволені сповіщення. */
export async function scheduleTimerSignal(deadline, title) {
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('default', {
    importance: Notifications.AndroidImportance.HIGH,
    name: 'Default',
    sound: 'default',
  });
  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted' && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync();
  const seconds = Math.ceil((deadline - Date.now()) / 1000);
  if (permission.status !== 'granted' || seconds <= 0) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title, sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, channelId: 'default' },
  });
}

/** EN: Cancels this set's pending alarm without touching other notifications. UK: Скасовує запланований сигнал цього підходу, не змінюючи інші сповіщення. */
export async function cancelTimerSignal(identifier) {
  if (identifier) {
    try { await Notifications.cancelScheduledNotificationAsync(identifier); } catch (error) { console.warn('Could not cancel timed-set notification', error); }
  }
}

/** EN: Adds a foreground vibration when the countdown crosses zero. UK: Додає вібрацію у відкритому застосунку, коли відлік досягає нуля. */
export function signalTimerNow() {
  if (AppState.currentState === 'active') Vibration.vibrate(400);
}
