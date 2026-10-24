// EN: Uses Web Audio for the timed-set completion cue; web has no local notification alarm.
// UK: Використовує Web Audio для сигналу завершення підходу; веб не має локального сигналу сповіщення.
let context;

/** EN: Opens the audio context from the Start button's user gesture. UK: Відкриває аудіоконтекст під час натискання кнопки старту. */
export function prepareTimerSignal() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  context ||= new AudioContextClass();
  if (context.state === 'suspended') void context.resume().catch(() => {});
}

/** EN: Web schedules no OS alarm; its countdown tick plays the beep. UK: Веб не планує системний сигнал; звук відтворює оновлення таймера. */
export async function scheduleTimerSignal() { return null; }
/** EN: Web has no scheduled alarm to cancel. UK: У вебі немає запланованого системного сигналу для скасування. */
export async function cancelTimerSignal() {}

/** EN: Plays a short beep after a live countdown crosses zero. UK: Відтворює короткий звук після досягнення нуля активним відліком. */
export function signalTimerNow() {
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.15, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.25);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.25);
}
