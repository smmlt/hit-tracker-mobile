/**
 * Shows the analytics overview for the selected period, combining profile/activity data with transformed chart summaries and drill-down navigation. / Показує огляд аналітики за вибраний період, поєднуючи дані профілю й активності з перетвореними підсумками графіків і переходами до деталей.
 */
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAnalyticsPeriod } from '../context/AnalyticsPeriodContext';
import AnalyticsPeriodPicker from '../components/analytics/AnalyticsPeriodPicker';
import { chartPointerConfig } from '../components/analytics/chartPointer';
import { analyticsService } from '../services/analyticsService';
import { bodyMetricsService } from '../services/bodyMetricsService';
import { formatMetric, formatMetricDelta, periodToDateRange } from '../utils/bodyMetrics';
import { translateCatalogName } from '../localization/catalog';
import { createStyles } from './AnalyticsDashboardScreen.styles';

const BODY_METRICS = [
  ['weight', 'bodyMetricsWeight'],
  ['waistCircumference', 'bodyMetricsWaist'],
  ['bodyFatPercentage', 'bodyMetricsFat'],
  ['muscleMass', 'bodyMetricsMuscle'],
];

const TODAY_METRICS = [
  ['analyticsActiveTime', 'time-outline', 'activeMinutes'],
  ['analyticsWorkingSets', 'layers-outline', 'workingSets'],
  ['analyticsVolume', 'barbell-outline', 'volumeKg'],
  ['analyticsCompletedWorkouts', 'checkmark-circle-outline', 'workouts'],
];

/**
 * EN: Loads the selected analytics period, derives chart-ready summaries, and routes each card to its detailed view.
 * UK: Завантажує вибраний період аналітики, готує підсумки для графіків і спрямовує кожну картку до докладного подання.
 */
export default function AnalyticsDashboardScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { locale, t } = useContext(LanguageContext);
  const { userToken } = useContext(AuthContext);
  const { period } = useAnalyticsPeriod();
  const { width } = useWindowDimensions();
  const requestId = useRef(0);
  const range = useMemo(
    /* EN: Converts the shared period selection into the stable date boundaries required by every request. / UK: Перетворює спільно вибраний період на сталі межі дат, потрібні для кожного запиту. */
    () => periodToDateRange(period),
    [period]
  );
  const [data, setData] = useState({ overview: null, intensity: null, strength: [], body: null, schedule: null });
  const [intensityBoxWidth, setIntensityBoxWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  /**
   * EN: Normalizes optional numeric API values and formats them according to the active interface locale.
   * UK: Нормалізує необов'язкові числові значення з API та форматує їх відповідно до поточної мови інтерфейсу.
   */
  const number = (value, digits = 0) => Number(value || 0).toLocaleString(localeTag, { maximumFractionDigits: digits });

  const load = useCallback(
    /* EN: Fetches independent analytics panels concurrently, keeps successful partial data, and ignores responses superseded by a newer request. / UK: Паралельно завантажує незалежні блоки аналітики, зберігає успішно отримані часткові дані та ігнорує відповіді, які замінив новіший запит. */
    async (refresh = false) => {
    if (!userToken) return;
    const id = ++requestId.current;
    refresh ? setRefreshing(true) : setLoading(true);
    setError(false);
    const requests = [
      analyticsService.overview(userToken, range),
      analyticsService.intensity(userToken, range),
      analyticsService.strength(userToken, range),
      bodyMetricsService.get(userToken, range),
    ];
    if (period === 'today') requests.push(analyticsService.schedule(userToken, range.start));
    const results = await Promise.allSettled(requests);
    if (id !== requestId.current) return;
    const [overview, intensity, strength, body, schedule] = results;
    setData({
      overview: overview.status === 'fulfilled' ? overview.value : null,
      intensity: intensity.status === 'fulfilled' ? intensity.value : null,
      strength: strength.status === 'fulfilled' ? strength.value.exercises || [] : [],
      body: body.status === 'fulfilled' ? body.value : null,
      schedule: schedule?.status === 'fulfilled' && Array.isArray(schedule.value) ? schedule.value.filter(
        /* EN: Keeps only assignments for the exact dashboard day because the schedule endpoint may return a wider window. / UK: Залишає лише призначення на точний день панелі, оскільки кінцева точка розкладу може повернути ширший проміжок. */
        (item) => item.scheduledFor === range.start
      ) : null,
    });
    setError(overview.status === 'rejected' || (period === 'today' && schedule?.status === 'rejected'));
    setLoading(false);
    setRefreshing(false);
    },
    [period, range, userToken]
  );

  useFocusEffect(useCallback(
    /* EN: Refreshes analytics whenever the screen regains focus so returning from an edit shows current data. / UK: Оновлює аналітику щоразу, коли екран знову отримує фокус, щоб після редагування відображалися актуальні дані. */
    () => {
    void load();
    return /* EN: Invalidates any in-flight response when the screen loses focus. / UK: Позначає будь-яку незавершену відповідь як застарілу, коли екран втрачає фокус. */ () => { requestId.current += 1; };
    },
    [load]
  ));

  const overview = data.overview || {};
  const summary = overview.summary || {};
  const plan = overview.plan || {};
  const activity = overview.activity || [];
  const muscles = overview.muscleGroups || [];
  const maxActivity = Math.max(1, ...activity.map(
    /* EN: Finds the largest planned-or-completed daily count used to scale all activity bars consistently. / UK: Знаходить найбільшу заплановану або виконану денну кількість для узгодженого масштабування всіх стовпчиків активності. */
    (item) => Math.max(Number(item.plannedWorkouts) || 0, Number(item.completedWorkouts) || 0)
  ));
  const maxMuscle = Math.max(1, ...muscles.map(
    /* EN: Extracts working-set totals to establish the common muscle-bar scale. / UK: Витягує кількість робочих підходів, щоб визначити спільний масштаб смуг м'язів. */
    (item) => Number(item.workingSets) || 0
  ));
  const intensity = data.intensity || {};
  const today = period === 'today';
  const trend = today && intensity.setRpeTrend?.length
    ? intensity.setRpeTrend.map(
      /* EN: Adapts today's set-level RPE points to the shared line-chart shape while preserving set labels. / UK: Перетворює сьогоднішні точки RPE окремих підходів на спільний формат лінійного графіка зі збереженням підписів підходів. */
      (point) => ({
        averageRpe: point.rpe,
        date: point.date,
        pointerLabel: `${new Date(`${point.date}T12:00:00`).toLocaleDateString(localeTag, { day: 'numeric', month: 'short' })} · ${t('analyticsSetNumber')} ${point.setNumber}`,
      })
    )
    : (overview.intensityTrend || []).filter(
      /* EN: Removes period points without an average so the chart never receives an invalid numeric value. / UK: Вилучає точки періоду без середнього значення, щоб графік не отримував некоректне число. */
      (point) => point.averageRpe != null
    );
  const bodyMetrics = data.body?.metrics || {};
  const intensityChartWidth = intensityBoxWidth || Math.max(160, Math.min(736, width - 64));
  const narrowBodyGrid = width < 480;
  const scheduled = data.schedule || [];
  const scheduleAvailable = data.schedule !== null;
  const completed = scheduled.filter(
    /* EN: Counts only assignments whose persisted status confirms completion. / UK: Підраховує лише призначення, збережений стан яких підтверджує завершення. */
    (item) => item.status === 'completed'
  ).length;
  const todayActual = Math.max(completed, Number(summary.workouts) || 0);
  const todayBarMax = Math.max(1, scheduled.length, todayActual);
  const firstScheduled = scheduled[0];
  const completionPercent = scheduled.length ? Math.round(completed / scheduled.length * 100) : null;
  const periodScheduled = Number(plan.scheduledAssignments) || 0;
  const periodCompleted = Number(plan.completedAssignments) || 0;
  const activeMinutes = Math.max(0, Number(summary.activeMinutes) || 0);
  const activeTime = activeMinutes >= 60
    ? `${Math.floor(activeMinutes / 60)}:${String(Math.round(activeMinutes % 60)).padStart(2, '0')} ${t('hourShort')}`
    : `${number(activeMinutes)} ${t('minutesShort')}`;
  /**
   * EN: Maps each configured today-card key to its localized, display-ready value.
   * UK: Зіставляє ключ кожної сьогоднішньої картки з локалізованим значенням, готовим до показу.
   */
  const todayMetricValue = (key) => ({
    activeMinutes: activeTime,
    workingSets: number(summary.workingSets),
    volumeKg: `${number(summary.volumeKg)} ${t('kgShort')}`,
    workouts: number(summary.workouts),
  }[key]);
  /**
   * EN: Opens the first scheduled assignment through the parent workout navigator while preserving its assignment identity and date.
   * UK: Відкриває перше заплановане призначення через батьківський навігатор тренувань зі збереженням його ідентифікатора та дати.
   */
  const openScheduledProgram = () => {
    if (!firstScheduled) return;
    navigation.getParent()?.navigate('ActiveWorkout', {
      screen: 'ProgramDetails',
      params: { assignmentRef: String(firstScheduled.id), date: range.from },
    });
  };

  if (loading && !data.overview) return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}><ActivityIndicator color={theme.primary} size="large" style={styles.pageLoader} /></SafeAreaView>;

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={/* EN: Reloads the same period while exposing pull-to-refresh state. / UK: Повторно завантажує той самий період і показує стан оновлення жестом. */ () => load(true)} tintColor={theme.primary} />} showsVerticalScrollIndicator={false}>
      <Text accessibilityRole="header" style={styles.title}>{t('analytics').toUpperCase()}</Text>
      <AnalyticsPeriodPicker />
      {error ? <View style={styles.card}><Text style={styles.muted}>{t('analyticsUnavailable')}</Text><Pressable accessibilityRole="button" onPress={/* EN: Retries the failed period load without entering refresh mode. / UK: Повторює невдале завантаження періоду без увімкнення стану оновлення жестом. */ () => load()} style={styles.retry}><Text style={styles.retryText}>{t('retry')}</Text></Pressable></View> : null}
      {today ? <View style={styles.card}>
        <Text style={styles.micro}>{t('analyticsProgram').toUpperCase()}</Text>
        <Pressable accessibilityRole={firstScheduled ? 'button' : undefined} accessibilityLabel={firstScheduled ? t('analyticsOpenScheduledProgram') : undefined} disabled={!firstScheduled} onPress={openScheduledProgram} style={styles.todayProgramRow}>
          <View style={styles.todayProgramCopy}>
            <Text numberOfLines={2} style={firstScheduled ? styles.todayProgramName : styles.muted}>{firstScheduled?.programName || firstScheduled?.name || (scheduleAvailable ? t('analyticsNoPlanToday') : t('analyticsScheduleUnavailable'))}</Text>
            {scheduled.length > 1 ? <Text style={styles.micro}>{t('analyticsMorePrograms', { count: scheduled.length - 1 })}</Text> : null}
          </View>
          {completionPercent != null ? <View style={styles.completionBadge}><Text style={styles.completionBadgeText}>{completionPercent}%</Text></View> : null}
          {firstScheduled ? <Ionicons color={theme.textPrimary} name="chevron-forward" size={22} /> : null}
        </Pressable>
      </View> : null}
      {today ? <View style={styles.todayMetrics}>{TODAY_METRICS.map(
        /* EN: Renders each configured headline metric with its matching label, icon, and derived value. / UK: Відображає кожен налаштований головний показник із відповідними назвою, піктограмою та обчисленим значенням. */
        ([label, icon, key]) => <View key={key} style={styles.todayMetricCard}>
        <Ionicons color={theme.primary} name={icon} size={18} />
        <Text style={styles.summaryLabel}>{t(label)}</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.todayMetricValue}>{todayMetricValue(key)}</Text>
      </View>
      )}</View> : null}

      {today ? <View style={styles.topRow}>
        <View style={[styles.card, styles.planCard]}>
          <Text style={styles.cardTitle}>{t('analyticsPlanCompletion')}</Text>
          <View accessibilityLabel={scheduled.length ? t('analyticsTodayCompletion', { completed, scheduled: scheduled.length }) : t('analyticsNoPlanToday')} style={styles.todayBars}>
            <View style={styles.todayBarColumn}><Text style={styles.barCount}>{scheduled.length}</Text><View style={[styles.todayBar, styles.todayBarPlanned, { height: Math.max(4, scheduled.length / todayBarMax * 64) }]} /><Text style={styles.chartLabel}>{t('analyticsPlan')}</Text></View>
            <View style={styles.todayBarColumn}><Text style={styles.barCount}>{todayActual}</Text><View style={[styles.todayBar, styles.todayBarDone, { height: Math.max(4, todayActual / todayBarMax * 64) }]} /><Text style={styles.chartLabel}>{t('analyticsActual')}</Text></View>
          </View>
          <Text style={styles.muted}>{scheduled.length ? `${completed} ${t('analyticsOf')} ${scheduled.length}` : t('analyticsNoPlanToday')}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={/* EN: Opens the full muscle-balance breakdown from the compact preview. / UK: Відкриває повний розподіл навантаження між м'язами з короткого попереднього перегляду. */ () => navigation.navigate('AnalyticsMuscleBalance')} style={[styles.card, styles.activityCard]}>
          <View style={styles.cardHeader}><Text style={styles.cardTitle}>{t('analyticsMuscleGroups')}</Text><Ionicons color={theme.textPrimary} name="chevron-forward" size={20} /></View>
          {muscles.length ? muscles.slice(0, 4).map(
            /* EN: Builds the four-row preview and scales every fill against the period's busiest muscle group. / UK: Формує попередній перегляд із чотирьох рядків і масштабує кожну смугу відносно найнавантаженішої групи м'язів за період. */
            (item) => <View key={item.muscleId} style={styles.muscleRow}><Text numberOfLines={1} style={styles.muscleName}>{translateCatalogName(t, 'muscle', item.name)}</Text><View style={styles.muscleTrack}><View style={[styles.muscleFill, { width: `${Number(item.workingSets) / maxMuscle * 100}%` }]} /></View><Text style={styles.muscleCount}>{number(item.workingSets, 1)}</Text></View>
          ) : <Text style={styles.muted}>{t('analyticsNoMuscleGroups')}</Text>}
        </Pressable>
      </View> : null}

      {!today ? <View style={styles.topRow}>
        <View style={[styles.card, styles.planCard]}>
          <Text style={styles.cardTitle}>{t('analyticsPlanCompletion')}</Text>
          <View style={styles.inline}><Text style={styles.hero}>{periodCompleted}</Text><Text style={styles.muted}> {t('analyticsOf')} {periodScheduled}</Text><Text style={styles.percent}>{plan.adherencePercent == null ? '—' : `${number(plan.adherencePercent)}%`}</Text></View>
          <Text style={styles.muted}>{t('analyticsStreakShort')}: <Text style={styles.accentText}>{plan.currentStreakDays ?? 0}</Text> {t('analyticsDaysShort')}</Text>
        </View>
        <View style={[styles.card, styles.activityCard]}>
          <Text style={styles.cardTitle}>{t('analyticsActivity')}</Text>
          <View style={styles.activityLegend}><View style={[styles.legendDot, styles.legendDone]} /><Text style={styles.micro}>{t('scheduleStatus_completed')}</Text><View style={[styles.legendDot, styles.legendMissed]} /><Text style={styles.micro}>{t('scheduleStatus_missed')}</Text></View>
          <View accessibilityLabel={t('analyticsComplianceChart')} style={styles.activityChart}>
            {activity.slice(-7).map(
              /* EN: Converts each recent day into stacked completed and missed shares on the common activity scale. / UK: Перетворює кожен останній день на складені частки виконаних і пропущених тренувань у спільному масштабі активності. */
              (item) => {
              const planned = Number(item.plannedWorkouts) || 0;
              const completed = Number(item.completedWorkouts) || 0;
              const total = Math.max(planned, completed);
              const completedShare = total ? Math.min(100, completed / total * 100) : 0;
              const missedShare = total ? Math.max(0, planned - completed) / total * 100 : 0;
              return <View key={item.date} style={styles.activityColumn}>
                <View style={[styles.activityBar, { height: Math.max(total ? 10 : 2, total / maxActivity * 52) }]}><View style={[styles.activityMissed, { height: `${missedShare}%` }]} /><View style={[styles.activityDone, { height: `${completedShare}%` }]} /></View>
                <Text style={styles.chartLabel}>{item.date.slice(8)}</Text>
              </View>;
              }
            )}
          </View>
        </View>
      </View> : null}

      {!today ? <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('analyticsTrainingSummary')}</Text>
        <View style={styles.summaryRow}>
          {[
            ['analyticsCompletedWorkouts', summary.workouts ?? 0, ''],
            ['analyticsActiveTime', number(summary.activeMinutes, 0), t('minutesShort')],
            ['analyticsWorkingSets', summary.workingSets ?? 0, ''],
            ['analyticsVolume', number(summary.volumeKg, 0), t('kgShort')],
          ].map(
            /* EN: Renders the period totals and adds separators after the first summary cell. / UK: Відображає підсумки періоду та додає роздільники після першої клітинки підсумку. */
            ([key, value, unit], index) => <View key={key} style={[styles.summaryItem, index > 0 && styles.summaryBorder]}><Text style={styles.summaryLabel}>{t(key)}</Text><Text numberOfLines={1} style={styles.summaryValue}>{value}{unit ? <Text style={styles.unit}> {unit}</Text> : null}</Text></View>
          )}
        </View>
      </View> : null}

      <View style={styles.card}>
        <Pressable accessibilityRole="button" onPress={/* EN: Opens the detailed intensity distribution for the selected period. / UK: Відкриває докладний розподіл інтенсивності за вибраний період. */ () => navigation.navigate('AnalyticsIntensity')} style={styles.cardHeader}><Text style={styles.cardTitle}>{t(today ? 'analyticsDayIntensity' : 'analyticsIntensity')}</Text><Ionicons color={theme.textPrimary} name="chevron-forward" size={22} /></Pressable>
        <View onLayout={/* EN: Captures the rendered container width so the chart fits without horizontal overflow. / UK: Зберігає фактичну ширину контейнера, щоб графік уміщався без горизонтального переповнення. */ (event) => setIntensityBoxWidth(Math.floor(event.nativeEvent.layout.width))} style={styles.todayIntensityChart}>
          {trend.length ? <LineChart adjustToWidth areaChart color={theme.primary} curved={trend.length > 2} data={trend.map(
            /* EN: Converts normalized trend records into the value and pointer-label fields expected by the chart library. / UK: Перетворює нормалізовані записи тенденції на поля значення та підпису вказівника, яких очікує бібліотека графіків. */
            (point) => ({ value: Number(point.averageRpe), pointerLabel: point.pointerLabel || new Date(`${point.date}T12:00:00`).toLocaleDateString(localeTag, { day: 'numeric', month: 'short' }) })
          )} dataPointsColor={theme.primary} disableScroll endFillColor={theme.cardBackground} endOpacity={0} endSpacing={0} height={today ? 126 : 104} hideDataPoints={trend.length > 1} hideRules hideYAxisText initialSpacing={0} maxValue={10} noOfSections={2} pointerConfig={chartPointerConfig({ theme,
            /* EN: Formats pointer values with the RPE scale and locale-aware precision. / UK: Форматує значення вказівника за шкалою RPE з точністю, що враховує мову інтерфейсу. */
            formatValue: (value) => `RPE ${number(value, 1)}` })} startFillColor={theme.primary} startOpacity={0.3} thickness={2} width={intensityChartWidth} xAxisColor={theme.border} yAxisColor={theme.border} yAxisLabelWidth={0} /> : <View accessibilityLabel={t('analyticsNoRpeDataPeriod')} style={[styles.emptyTrend, styles.todayEmptyTrend, { width: intensityChartWidth }]}><View style={styles.emptyTrendLine} /><Text style={styles.emptyTrendText}>{t('analyticsNoRpeDataPeriod')}</Text></View>}
        </View>
        <View style={styles.intensityFooter}><View><Text style={styles.hero}>{summary.averageRpe == null ? '—' : number(summary.averageRpe, 1)}</Text><Text style={styles.micro}>{t('analyticsAverageRpe')}</Text></View><Text style={styles.micro}>{t('analyticsSetsCount', { count: intensity.totalSets ?? summary.workingSets ?? 0 })}</Text></View>
        <View style={styles.bandRow}>{(intensity.rpeDistribution || []).map(
          /* EN: Renders each RPE band with its percentage contribution to the selected period. / UK: Відображає кожен діапазон RPE з його відсотковою часткою за вибраний період. */
          (band) => <Text key={band.range} style={styles.band}>{band.range} <Text style={styles.bandValue}>{number(band.percentage)}%</Text></Text>
        )}</View>
        <Text style={styles.muted}>{t('analyticsFailureRate')}: {intensity.failurePercentage == null ? '—' : `${number(intensity.failurePercentage)}%`}</Text>
      </View>

      {!today ? <Pressable accessibilityRole="button" onPress={/* EN: Opens the complete muscle-balance report for non-daily periods. / UK: Відкриває повний звіт про баланс м'язів для періодів, довших за день. */ () => navigation.navigate('AnalyticsMuscleBalance')} style={styles.card}>
        <View style={styles.cardHeader}><View><Text style={styles.cardTitle}>{t('analyticsMuscleGroups')}</Text><Text style={styles.micro}>{t('analyticsEstimatedSets')}</Text></View><Ionicons color={theme.textPrimary} name="chevron-forward" size={22} /></View>
        {muscles.length ? muscles.map(
          /* EN: Renders every muscle group's estimated working sets relative to the period maximum. / UK: Відображає оцінену кількість робочих підходів кожної групи м'язів відносно максимуму за період. */
          (item) => <View key={item.muscleId} style={styles.muscleRow}><Text numberOfLines={1} style={styles.muscleName}>{translateCatalogName(t, 'muscle', item.name)}</Text><View style={styles.muscleTrack}><View style={[styles.muscleFill, { width: `${Number(item.workingSets) / maxMuscle * 100}%` }]} /></View><Text style={styles.muscleCount}>{number(item.workingSets, 1)}</Text></View>
        ) : <Text style={styles.muted}>{t('analyticsNoMuscleGroups')}</Text>}
      </Pressable> : null}

      {!today ? <Pressable accessibilityRole="button" onPress={/* EN: Opens the complete exercise-by-exercise strength progression report. / UK: Відкриває повний звіт про прогрес сили для кожної вправи. */ () => navigation.navigate('AnalyticsStrength')} style={styles.card}>
        <View style={styles.cardHeader}><Text style={styles.cardTitle}>{t('analyticsStrengthProgress')}</Text><Ionicons color={theme.textPrimary} name="chevron-forward" size={22} /></View>
        {data.strength.length ? data.strength.slice(0, 5).map(
          /* EN: Builds the five-exercise preview with localized names and signed weight changes. / UK: Формує попередній перегляд п'яти вправ із локалізованими назвами та змінами ваги зі знаком. */
          (exercise) => <View key={exercise.exerciseId} style={styles.strengthRow}><Text numberOfLines={1} style={styles.strengthName}>{exercise.name ? translateCatalogName(t, 'exercise', exercise.name) : t('exerciseUnknown', { id: exercise.exerciseId })}</Text><Text style={styles.delta}>{Number(exercise.changeKg) > 0 ? '+' : ''}{number(exercise.changeKg, 1)} {t('kgShort')}</Text></View>
        ) : <Text style={styles.muted}>{t('analyticsNoProgress')}</Text>}
        {data.strength.length > 5 ? <Text style={styles.link}>{t('analyticsAllExercises')}</Text> : null}
      </Pressable> : null}

      <View style={styles.card}>
        <View style={styles.cardHeader}><Pressable accessibilityRole="button" onPress={/* EN: Opens the complete body-measurement history from the card title. / UK: Відкриває повну історію вимірювань тіла із заголовка картки. */ () => navigation.navigate('BodyMetricsDetails')}><Text style={styles.cardTitle}>{t('bodyMetricsPreview')}</Text></Pressable>{today ? <Pressable accessibilityRole="button" onPress={/* EN: Opens the form for recording a new body measurement from today's dashboard. / UK: Відкриває форму додавання нового вимірювання тіла із сьогоднішньої панелі. */ () => navigation.navigate('AddBodyMeasurement')} style={styles.addMeasurementButton}><Text style={styles.addMeasurementText}>{t('addMeasurement')}</Text></Pressable> : <Pressable accessibilityLabel={t('bodyMetricsPreview')} accessibilityRole="button" onPress={/* EN: Opens body-measurement history from the period card's chevron. / UK: Відкриває історію вимірювань тіла за стрілкою картки періоду. */ () => navigation.navigate('BodyMetricsDetails')}><Ionicons color={theme.textPrimary} name="chevron-forward" size={22} /></Pressable>}</View>
        <Pressable accessibilityRole="button" onPress={/* EN: Makes the entire body-metrics preview row open the detailed history. / UK: Дає змогу відкрити докладну історію натисканням на весь рядок попереднього перегляду вимірювань. */ () => navigation.navigate('BodyMetricsDetails')} style={[styles.bodyRow, narrowBodyGrid && styles.bodyRowNarrow]}>{BODY_METRICS.map(
          /* EN: Resolves each configured measurement to its latest localized value and period delta. / UK: Для кожного налаштованого вимірювання визначає останнє локалізоване значення та зміну за період. */
          ([key, label], index) => {
          const metric = bodyMetrics[key];
          return <View key={key} style={[styles.bodyItem, narrowBodyGrid && styles.bodyItemNarrow, (narrowBodyGrid ? index % 2 === 1 : index > 0) && styles.summaryBorder, narrowBodyGrid && index > 1 && styles.bodyItemLower]}><Text style={styles.summaryLabel}>{t(label)}</Text><Text style={styles.bodyValue}>{metric?.latest ? formatMetric(metric.latest.value, key, locale, t) : '—'}</Text><Text style={[styles.micro, Number(metric?.change) > 0 && styles.delta]}>{metric?.change == null ? '—' : formatMetricDelta(metric.change, key, locale, t)}</Text></View>;
          }
        )}</Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('analyticsInsights')}</Text>
        <View style={styles.insightRow}><Ionicons color={theme.secondary} name="bulb-outline" size={22} /><Text style={styles.insight}>{today
          ? (!scheduleAvailable ? t('analyticsScheduleUnavailable') : (scheduled.length ? t('analyticsInsightTodayProgress', { completed, planned: scheduled.length }) : t('analyticsInsightTodayNoPlan')))
          : (plan.adherencePercent == null ? t('analyticsInsightNoPlan') : t('analyticsInsightAdherence', { percent: number(plan.adherencePercent), completed: plan.completedAssignments, planned: plan.scheduledAssignments }))}</Text></View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
