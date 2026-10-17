/**
 * Collects and validates a dated body measurement, loads the current user from AuthContext, and saves it before returning to the body-metrics flow. / Збирає та перевіряє вимірювання тіла з датою, отримує поточного користувача з AuthContext і зберігає дані перед поверненням до потоку показників тіла.
 */
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { CustomToast } from '../components/feedback';
import { bodyMetricsService } from '../services/bodyMetricsService';
import { BODY_METRIC_RANGES, dateInputToIso, dateKey, validateBodyMeasurement } from '../utils/bodyMetrics';
import { createStyles } from './AddBodyMeasurementScreen.styles';

const FIELDS = [
  ['weight', 'bodyMetricsWeight', 'kgShort'],
  ['bodyFatPercentage', 'bodyMetricsFat', 'percentageShort'],
  ['muscleMass', 'bodyMetricsMuscle', 'kgShort'],
  ['waistCircumference', 'bodyMetricsWaist', 'cmShort'],
];

/**
 * EN: Returns a new local date shifted by whole calendar days without mutating the supplied date.
 * UK: Повертає нову локальну дату, зміщену на цілу кількість календарних днів, не змінюючи передану дату.
 */
const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

/**
 * EN: Builds the fixed six-week Monday-first grid that surrounds the requested calendar month.
 * UK: Створює сталу шеститижневу сітку від понеділка, яка охоплює вибраний календарний місяць.
 */
function calendarDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, /* EN: Produces each consecutive cell from the grid's Monday start. / UK: Створює кожну послідовну клітинку від понеділка, з якого починається сітка. */ (_, index) => addDays(start, index));
}

/**
 * EN: Collects optional body measurements for one non-future date, validates them, and persists one normalized record.
 * UK: Збирає необов'язкові вимірювання тіла за одну дату не в майбутньому, перевіряє їх і зберігає один нормалізований запис.
 */
export default function AddBodyMeasurementScreen({ navigation, route }) {
  const { userToken } = useContext(AuthContext);
  const { locale, t } = useContext(LanguageContext);
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();
  const today = new Date();
  const todayKey = dateKey(today);
  const [form, setForm] = useState({ weight: '', bodyFatPercentage: '', muscleMass: '', waistCircumference: '', recordedAt: todayKey });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [month, setMonth] = useState(/* EN: Initializes the calendar at the first day of the current local month. / UK: Ініціалізує календар першим днем поточного місцевого місяця. */ () => new Date(today.getFullYear(), today.getMonth(), 1));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastTimer = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const days = useMemo(/* EN: Rebuilds the 42 calendar cells only when the displayed month changes. / UK: Повторно створює 42 клітинки календаря лише після зміни показаного місяця. */ () => calendarDays(month), [month]);
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
  const currentMonthKey = `${today.getFullYear()}-${today.getMonth()}`;
  /**
   * EN: Returns to the caller normally, but restores the Profile tab when this form was opened from the profile flow.
   * UK: Звичайно повертається до попереднього екрана, але відновлює вкладку профілю, якщо форму відкрито з потоку профілю.
   */
  const goBack = () => {
    if (route.params?.from !== 'profile') return navigation.goBack();
    navigation.popToTop();
    return navigation.getParent()?.navigate('Profile');
  };

  useEffect(/* EN: Installs a cleanup that prevents the toast timer from updating an unmounted screen. / UK: Встановлює очищення, яке не дає таймеру сповіщення оновити демонтований екран. */ () => /* EN: Cancels the pending toast dismissal during unmount. / UK: Скасовує заплановане приховування сповіщення під час демонтажу. */ () => clearTimeout(toastTimer.current), []);

  /**
   * EN: Replaces any pending toast, displays the new result, and schedules its automatic dismissal.
   * UK: Замінює попереднє заплановане сповіщення, показує новий результат і планує його автоматичне приховування.
   */
  const showToast = (message, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ visible: true, message, type });
    toastTimer.current = setTimeout(/* EN: Hides this toast after the brief confirmation interval. / UK: Приховує це сповіщення після короткого проміжку підтвердження. */ () => setToast(/* EN: Preserves toast content while changing only visibility. / UK: Зберігає вміст сповіщення, змінюючи лише його видимість. */ (current) => ({ ...current, visible: false })), 1800);
  };

  /**
   * EN: Creates a field-specific input handler that merges text into the latest form state.
   * UK: Створює обробник для конкретного поля, який додає текст до найновішого стану форми.
   */
  const update = (key) => /* EN: Applies the entered value to the field captured by the outer handler. / UK: Записує введене значення в поле, визначене зовнішнім обробником. */ (value) => setForm(/* EN: Preserves every other measurement while updating one field. / UK: Зберігає всі інші вимірювання під час оновлення одного поля. */ (current) => ({ ...current, [key]: value }));

  /**
   * EN: Translates structured body-metric API failures into precise localized feedback with a safe generic fallback.
   * UK: Перетворює структуровані помилки API показників тіла на точні локалізовані повідомлення з безпечним загальним запасним варіантом.
   */
  const serverErrorMessage = (requestError) => {
    const code = requestError.details?.code || requestError.details?.errorCode;
    if (code === 'BODY_METRIC_REQUIRED') return t('bodyMetricRequired');
    if (code === 'BODY_METRIC_FUTURE_DATE') return t('bodyMetricFutureDate');
    if (code === 'INVALID_PERIOD') return t('bodyMetricInvalidPeriod');
    if (code === 'BODY_METRIC_OUT_OF_RANGE') {
      const fieldKeys = { weight: 'bodyMetricsWeight', bodyFatPercentage: 'bodyMetricsFat', muscleMass: 'bodyMetricsMuscle', waistCircumference: 'bodyMetricsWaist' };
      const messages = (requestError.details?.details || []).map(/* EN: Formats each server-reported field range violation separately. / UK: Окремо форматує кожне повідомлене сервером порушення діапазону поля. */ (detail) => t('bodyMetricOutOfRange', { field: t(fieldKeys[detail.field] || 'bodyMetrics'), min: detail.min, max: detail.max }));
      if (messages.length) return messages.join('\n');
      return t('bodyMetricInvalid');
    }
    return requestError.status >= 400 && requestError.status < 500 ? t('bodyMetricInvalid') : t('bodyMetricsSaveFailed');
  };

  /**
   * EN: Validates the form, normalizes entered decimal values and date, saves the record, then confirms and returns on success.
   * UK: Перевіряє форму, нормалізує введені десяткові значення й дату, зберігає запис, а після успіху показує підтвердження та повертається.
   */
  const submit = async () => {
    const validation = validateBodyMeasurement(form);
    if (!validation.valid) {
      if (validation.errors.required) return setError(t('bodyMetricRequired'));
      if (validation.errors.futureDate) return setError(t('bodyMetricFutureDate'));
      const messages = FIELDS.filter(/* EN: Selects only fields rejected by local range validation. / UK: Вибирає лише поля, відхилені локальною перевіркою діапазону. */ ([key]) => validation.errors[key]).map(/* EN: Converts each invalid field to a localized allowed-range message. / UK: Перетворює кожне недійсне поле на локалізоване повідомлення про допустимий діапазон. */ ([key, labelKey]) => (
        t('bodyMetricOutOfRange', { field: t(labelKey), min: BODY_METRIC_RANGES[key][0], max: BODY_METRIC_RANGES[key][1] })
      ));
      return setError(messages.length ? messages.join('\n') : t('bodyMetricInvalid'));
    }
    setLoading(true);
    setError('');
    const data = Object.fromEntries(FIELDS.filter(/* EN: Omits optional measurements the user left empty. / UK: Вилучає необов'язкові вимірювання, які користувач залишив порожніми. */ ([key]) => form[key] !== '').map(/* EN: Converts accepted comma or dot decimal text into API numbers. / UK: Перетворює прийнятий десятковий текст із комою або крапкою на числа для API. */ ([key]) => [key, Number(String(form[key]).replace(',', '.'))]));
    data.recordedAt = dateInputToIso(form.recordedAt);
    try {
      await bodyMetricsService.add(userToken, data);
      showToast(t('measurementSaved'));
      setTimeout(goBack, 700);
    } catch (requestError) {
      setError(serverErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: width < 390 ? 14 : 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel={t('back')} accessibilityRole="button" onPress={goBack} style={styles.backButton}><Ionicons color={theme.textPrimary} name="arrow-back" size={24} /></Pressable>
          <Text accessibilityRole="header" style={styles.title}>{t('addMeasurement')}</Text>
          <View style={styles.backButton} />
        </View>
        <Text style={styles.hint}>{t('bodyMetricRequired')}</Text>
        {FIELDS.map(/* EN: Renders one localized numeric input for every supported body metric. / UK: Відображає одне локалізоване числове поле для кожного підтримуваного показника тіла. */ ([key, labelKey, unit]) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{t(labelKey)} ({t(unit)})</Text>
            <TextInput accessibilityLabel={t(labelKey)} keyboardType="decimal-pad" onBlur={/* EN: Removes visual focus state after leaving a metric input. / UK: Прибирає візуальний стан фокусу після виходу з поля показника. */ () => setFocusedField('')} onChangeText={update(key)} onFocus={/* EN: Marks this metric as focused for input styling. / UK: Позначає цей показник як активний для оформлення поля. */ () => setFocusedField(key)} placeholder={t('bodyMetricsValuePlaceholder')} placeholderTextColor={theme.textSecondary} style={[styles.input, focusedField === key && styles.inputFocused]} value={form[key]} />
          </View>
        ))}
        <Text style={styles.label}>{t('measurementDate')}</Text>
        <Pressable accessibilityRole="button" onPress={/* EN: Opens the date picker without changing the current selection. / UK: Відкриває вибір дати без зміни поточного вибору. */ () => setCalendarOpen(true)} style={/* EN: Applies keyboard, pointer, and pressed feedback to the date control. / UK: Застосовує відгук клавіатури, вказівника та натискання до елемента дати. */ ({ focused, hovered, pressed }) => [styles.dateButton, (focused || hovered) && styles.interactive, pressed && styles.pressed]}>
          <Text style={styles.dateText}>{new Date(`${form.recordedAt}T12:00:00`).toLocaleDateString(localeTag, { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          <Ionicons color={theme.textSecondary} name="calendar-outline" size={21} />
        </Pressable>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={loading} onPress={submit} style={/* EN: Combines disabled, keyboard, pointer, and pressed states for the save control. / UK: Поєднує стани вимкнення, клавіатури, вказівника та натискання для кнопки збереження. */ ({ focused, hovered, pressed }) => [styles.submit, loading && styles.disabled, (focused || hovered) && styles.interactive, pressed && styles.pressed]}>
          {loading ? <ActivityIndicator color={theme.onPrimary} /> : <Text style={styles.submitText}>{t('save')}</Text>}
        </Pressable>
      </ScrollView>
      <CustomToast fadeAnim={fadeAnim} message={toast.message} onClose={/* EN: Lets the toast close itself while retaining its current message and type. / UK: Дає сповіщенню закритися зі збереженням поточних повідомлення та типу. */ () => setToast(/* EN: Changes only toast visibility in the latest state. / UK: Змінює лише видимість сповіщення в найновішому стані. */ (current) => ({ ...current, visible: false }))} type={toast.type} visible={toast.visible} />

      <Modal animationType="fade" onRequestClose={/* EN: Closes the calendar for the platform back or dismiss action. / UK: Закриває календар після системної дії повернення або закриття. */ () => setCalendarOpen(false)} transparent visible={calendarOpen}>
        <View style={styles.overlay}>
          <View style={styles.calendarModal}>
            <Text style={styles.calendarTitle}>{t('measurementDate')}</Text>
            <View style={styles.monthHeader}>
              <Pressable accessibilityLabel={t('previous')} onPress={/* EN: Moves the calendar to the first day of the previous month. / UK: Переміщує календар на перший день попереднього місяця. */ () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={styles.monthArrow}><Ionicons color={theme.textPrimary} name="chevron-back" size={22} /></Pressable>
              <Text style={styles.monthTitle}>{month.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' })}</Text>
              <Pressable accessibilityLabel={t('next')} disabled={monthKey >= currentMonthKey} onPress={/* EN: Advances one month while the disabled guard prevents navigating beyond the current month. / UK: Переходить на один місяць уперед, а стан вимкнення не дозволяє перейти далі поточного місяця. */ () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={[styles.monthArrow, monthKey >= currentMonthKey && styles.disabled]}><Ionicons color={theme.textPrimary} name="chevron-forward" size={22} /></Pressable>
            </View>
            <View style={styles.weekHeader}>{['weekdayMon', 'weekdayTue', 'weekdayWed', 'weekdayThu', 'weekdayFri', 'weekdaySat', 'weekdaySun'].map(/* EN: Renders the localized Monday-first weekday header. / UK: Відображає локалізований заголовок днів тижня, починаючи з понеділка. */ (key) => <Text key={key} style={styles.weekLabel}>{t(key)}</Text>)}</View>
            <View style={styles.monthGrid}>{days.map(/* EN: Renders every calendar cell and disables future dates and padding days outside the displayed month. / UK: Відображає кожну клітинку календаря та вимикає майбутні дати й допоміжні дні поза показаним місяцем. */ (day) => {
              const key = dateKey(day);
              const disabled = key > todayKey || day.getMonth() !== month.getMonth();
              return <Pressable accessibilityLabel={day.toLocaleDateString(localeTag)} disabled={disabled} key={key} onPress={/* EN: Stores the selected local date and closes the calendar in one interaction. / UK: Зберігає вибрану місцеву дату й закриває календар однією дією. */ () => { setForm(/* EN: Preserves measurement entries while replacing only their date. / UK: Зберігає введені вимірювання, замінюючи лише їхню дату. */ (current) => ({ ...current, recordedAt: key })); setCalendarOpen(false); }} style={styles.monthDay}>
                <Text style={[styles.monthDayText, disabled && styles.disabled, key === form.recordedAt && styles.activeDayText]}>{day.getDate()}</Text>
              </Pressable>;
            })}</View>
            <Pressable accessibilityRole="button" onPress={/* EN: Cancels date picking without altering the selected date. / UK: Скасовує вибір дати без зміни вже вибраного значення. */ () => setCalendarOpen(false)} style={styles.closeButton}><Text style={styles.cancelText}>{t('cancel')}</Text></Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
