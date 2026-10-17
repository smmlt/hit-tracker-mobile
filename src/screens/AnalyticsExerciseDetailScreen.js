/**
 * Displays period-based analytics for one exercise, fetching the focused exercise history and navigating back to the exercise analytics list. / Показує аналітику однієї вправи за період, завантажує історію вибраної вправи та повертається до списку аналітики вправ.
 */
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BubbleChart, LineChart } from 'react-native-gifted-charts';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../localization/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAnalyticsPeriod } from '../context/AnalyticsPeriodContext';
import AnalyticsPeriodPicker from '../components/analytics/AnalyticsPeriodPicker';
import { chartPointerConfig } from '../components/analytics/chartPointer';
import { analyticsService } from '../services/analyticsService';
import { periodToDateRange } from '../utils/bodyMetrics';
import { createStyles } from './AnalyticsExerciseDetailScreen.styles';
import { translateCatalogName } from '../localization/catalog';

const REP_RANGES = [[1, 3], [4, 6], [7, 9], [10, 12], [13, 15], [16, Infinity]];

/**
 * EN: Loads period-scoped progress and set history for one exercise, derives comparison charts, and links a selected set to its workout.
 * UK: Завантажує прогрес та історію підходів однієї вправи за період, обчислює порівняльні графіки й пов'язує вибраний підхід із тренуванням.
 */
export default function AnalyticsExerciseDetailScreen({ navigation, route }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { locale, t } = useContext(LanguageContext);
  const { userToken } = useContext(AuthContext);
  const { period } = useAnalyticsPeriod();
  const { width } = useWindowDimensions();
  const exerciseId = route.params?.exerciseId;
  const name = route.params?.name
    ? translateCatalogName(t, 'exercise', route.params.name)
    : t('exerciseUnknown', { id: exerciseId });
  const range = useMemo(/* EN: Converts the shared analytics period into stable API date boundaries. / UK: Перетворює спільний період аналітики на сталі межі дат для API. */ () => periodToDateRange(period), [period]);
  const requestId = useRef(0);
  const [progress, setProgress] = useState([]);
  const [sets, setSets] = useState([]);
  const [progressBoxWidth, setProgressBoxWidth] = useState(0);
  const [scatterBoxWidth, setScatterBoxWidth] = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  /**
   * EN: Formats optional weights and estimates with locale-aware punctuation and one decimal at most.
   * UK: Форматує необов'язкові значення ваги й оцінки з урахуванням мови та не більш як одним десятковим знаком.
   */
  const number = (value) => Number(value || 0).toLocaleString(localeTag, { maximumFractionDigits: 1 });
  const chartBoxWidth = progressBoxWidth || Math.max(180, Math.min(width, 800) - 64);
  const chartWidth = Math.max(120, chartBoxWidth - 34);

  /**
   * EN: Fetches progression and raw sets concurrently and ignores results superseded by a newer focus or period request.
   * UK: Паралельно завантажує прогрес і необроблені підходи та ігнорує результати, які замінив новіший запит фокусу або періоду.
   */
  const load = useCallback(/* EN: Replaces both exercise datasets only for the current request generation. / UK: Замінює обидва набори даних вправи лише для поточного покоління запиту. */ async () => {
    if (!userToken || !exerciseId) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const [progressData, setsData] = await Promise.all([
        analyticsService.exerciseProgress(userToken, exerciseId, range),
        analyticsService.exerciseSets(userToken, exerciseId, range),
      ]);
      if (id === requestId.current) {
        setProgress(progressData.points || []);
        setSets(setsData.sets || []);
      }
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [exerciseId, range, userToken]);

  useFocusEffect(useCallback(/* EN: Reloads exercise analytics whenever the detail screen regains focus. / UK: Повторно завантажує аналітику вправи щоразу, коли екран деталей знову отримує фокус. */ () => {
    void load();
    return /* EN: Invalidates in-flight responses when the screen loses focus. / UK: Позначає незавершені відповіді застарілими, коли екран втрачає фокус. */ () => { requestId.current += 1; };
  }, [load]));

  const best = sets.reduce(/* EN: Chooses the heaviest set, breaking equal-weight ties by repetitions. / UK: Вибирає найважчий підхід, а за однакової ваги — підхід із більшою кількістю повторень. */ (winner, set) => !winner || Number(set.weightKg) > Number(winner.weightKg) || (Number(set.weightKg) === Number(winner.weightKg) && Number(set.reps) > Number(winner.reps)) ? set : winner, null);
  const bestE1rm = Math.max(0, ...progress.map(/* EN: Extracts finite estimated one-repetition maxima for the period peak. / UK: Витягує скінченні оцінки максимуму на одне повторення для визначення піка за період. */ (point) => Number(point.e1rmKg) || 0));
  const byRange = REP_RANGES.map(/* EN: Builds one best-weight row for each configured repetition band. / UK: Створює один рядок найкращої ваги для кожного налаштованого діапазону повторень. */ ([min, max]) => {
    const candidates = sets.filter(/* EN: Keeps sets whose repetitions fall inside this inclusive band. / UK: Залишає підходи, кількість повторень яких входить до цього включного діапазону. */ (set) => Number(set.reps) >= min && Number(set.reps) <= max);
    const row = candidates.reduce(/* EN: Selects the heaviest set within the current repetition band. / UK: Вибирає найважчий підхід у поточному діапазоні повторень. */ (winner, set) => !winner || Number(set.weightKg) > Number(winner.weightKg) ? set : winner, null);
    return { label: max === Infinity ? `${min}+` : `${min}-${max}`, row };
  });
  const scatterGroups = new Map();
  sets.filter(/* EN: Excludes non-positive coordinates that cannot form a meaningful strength point. / UK: Вилучає недодатні координати, які не можуть утворити змістовну точку сили. */ (set) => Number(set.reps) > 0 && Number(set.weightKg) > 0).forEach(/* EN: Groups identical repetition-and-weight pairs so frequency controls bubble size. / UK: Групує однакові пари повторень і ваги, щоб частота визначала розмір бульбашки. */ (set) => {
    const key = `${Number(set.reps)}:${Number(set.weightKg)}`;
    const current = scatterGroups.get(key);
    scatterGroups.set(key, { set, count: (current?.count || 0) + 1 });
  });
  const scatter = [...scatterGroups.values()].map(/* EN: Converts each group into a bounded bubble that selects its representative set when pressed. / UK: Перетворює кожну групу на бульбашку обмеженого розміру, яка після натискання вибирає відповідний підхід. */ ({ set, count }) => ({ x: Number(set.reps), y: Number(set.weightKg), r: Math.min(5, 2.5 + count * 0.35), /* EN: Exposes this bubble's set in the detail tooltip. / UK: Показує підхід цієї бульбашки в підказці з деталями. */ onPress: () => setSelected(set) }));
  const scatterMaxReps = Math.max(20, ...scatter.map(/* EN: Extracts repetition coordinates while preserving a readable minimum axis. / UK: Витягує координати повторень зі збереженням читабельного мінімуму осі. */ (point) => point.x));
  const scatterMaxWeight = Math.max(10, ...scatter.map(/* EN: Extracts weight coordinates while preserving a readable minimum axis. / UK: Витягує координати ваги зі збереженням читабельного мінімуму осі. */ (point) => point.y));
  const scatterChartWidth = Math.max(80, (scatterBoxWidth || Math.max(150, chartBoxWidth / 2 - 5)) - 28);
  /**
   * EN: Keeps the first and last dates and evenly samples intermediate labels to prevent axis crowding.
   * UK: Зберігає першу й останню дати та рівномірно вибирає проміжні підписи, щоб вісь не була перевантажена.
   */
  const showDateLabel = (index, length) => index === 0 || index === length - 1 || index % Math.max(1, Math.ceil((length - 1) / 4)) === 0;

  /**
   * EN: Opens the immutable history details for the workout that produced the selected set.
   * UK: Відкриває незмінні деталі історії тренування, у якому було виконано вибраний підхід.
   */
  const openWorkout = () => {
    if (!selected?.workoutId) return;
    navigation.getParent()?.navigate('History', { screen: 'HistoryDetails', params: { workoutId: selected.workoutId } });
  };

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable accessibilityLabel={t('back')} accessibilityRole="button" onPress={/* EN: Returns to the exercise analytics list. / UK: Повертає до списку аналітики вправ. */ () => navigation.goBack()} style={styles.backButton}><Ionicons color={theme.textPrimary} name="arrow-back" size={22} /></Pressable>
        <Text numberOfLines={1} accessibilityRole="header" style={styles.title}>{name.toUpperCase()}</Text>
        <View style={styles.backButton} />
      </View>
      <AnalyticsPeriodPicker />
      {loading ? <ActivityIndicator color={theme.primary} style={styles.loader} /> : error ? <View style={styles.card}><Text style={styles.muted}>{t('analyticsLoadFailed')}</Text><Pressable accessibilityRole="button" onPress={load}><Text style={styles.retry}>{t('retry')}</Text></Pressable></View> : <>
        <Text style={styles.sectionTitle}>{t('analyticsCurrentMetrics')}</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>{t('analyticsBestSet')}</Text><Text style={styles.summaryValue}>{best ? `${number(best.weightKg)} ${t('kgShort')} × ${best.reps}` : '—'}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>{t('analyticsBestWeight')}</Text><Text style={styles.summaryValue}>{best ? `${number(best.weightKg)} ${t('kgShort')}` : '—'}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>{t('analyticsOneRepMax')}</Text><Text style={styles.summaryValue}>{bestE1rm ? `${number(bestE1rm)} ${t('kgShort')}` : '—'}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>{t('analyticsWorkingSets')}</Text><Text style={styles.summaryValue}>{sets.length}</Text></View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('analyticsStrengthProgress')}</Text>
          <View onLayout={/* EN: Captures the rendered container width so the progress chart fits its card. / UK: Зберігає фактичну ширину контейнера, щоб графік прогресу вміщався в картку. */ (event) => setProgressBoxWidth(Math.floor(event.nativeEvent.layout.width))} style={styles.chartBox}>{progress.length > 1 ? <LineChart adjustToWidth color={theme.primary} curved data={progress.map(/* EN: Converts progress samples to chart values and sparsely labelled dates. / UK: Перетворює точки прогресу на значення графіка й розріджені підписи дат. */ (point, index) => ({ value: Number(point.e1rmKg) || 0, label: showDateLabel(index, progress.length) ? point.date?.slice(5) : '', pointerLabel: point.date ? new Date(`${point.date}T12:00:00`).toLocaleDateString(localeTag, { day: 'numeric', month: 'short', year: 'numeric' }) : '' }))} dataPointsColor={theme.primary} disableScroll endSpacing={0} height={165} hideDataPoints initialSpacing={0} pointerConfig={chartPointerConfig({ theme, /* EN: Formats pointer values as localized weights. / UK: Форматує значення вказівника як локалізовану вагу. */ formatValue: (value) => `${number(value)} ${t('kgShort')}` })} rulesColor={theme.border} thickness={2} width={chartWidth} xAxisColor={theme.border} xAxisLabelTextStyle={styles.axisText} yAxisColor={theme.border} yAxisLabelWidth={34} yAxisTextStyle={styles.axisText} /> : <Text style={styles.muted}>{t(progress.length ? 'analyticsStrengthNeedsMoreData' : 'analyticsNoProgress')}</Text>}</View>
        </View>
        <View style={styles.detailGrid}>
          <View style={[styles.card, styles.halfCard]}><Text style={styles.cardTitle}>{t('analyticsBestByRepRange')}</Text>{byRange.map(/* EN: Renders the strongest set found for each repetition band. / UK: Відображає найсильніший знайдений підхід для кожного діапазону повторень. */ ({ label, row }) => <View key={label} style={styles.rangeRow}><Text style={styles.muted}>{label}</Text><Text style={styles.detail}>{row ? `${number(row.weightKg)} ${t('kgShort')} × ${row.reps}` : '—'}</Text></View>)}</View>
          <View style={[styles.card, styles.halfCard]}><Text style={styles.cardTitle}>{t('analyticsStrengthByReps')}</Text><View onLayout={/* EN: Captures the card width used to size the bubble chart. / UK: Зберігає ширину картки для визначення розміру бульбашкового графіка. */ (event) => setScatterBoxWidth(Math.floor(event.nativeEvent.layout.width))} style={styles.chartBox}>{scatter.length ? <BubbleChart autoRoundLabelsX={false} bubblesColor={theme.textPrimary} data={scatter} disableScroll endSpacing={0} formatXLabel={/* EN: Renders repetition-axis values as whole numbers. / UK: Відображає значення осі повторень як цілі числа. */ (value) => String(Math.round(Number(value)))} height={190} initialSpacing={0} maxX={scatterMaxReps} maxY={Math.ceil(scatterMaxWeight / 10) * 10 + 10} minX={0} overflowTop={0} rulesColor={theme.border} scatterChart showFractionalXAxis={false} width={scatterChartWidth} xAxisColor={theme.textPrimary} xAxisLabelTextStyle={styles.axisText} xNoOfSections={4} xRoundToDigits={0} xStepValue={scatterMaxReps / 4} yAxisColor={theme.textPrimary} yAxisLabelWidth={28} yAxisTextStyle={styles.axisText} yNoOfSections={4} /> : <Text style={styles.muted}>{t('analyticsNoSets')}</Text>}</View>{selected ? <View style={styles.tooltip}><Text style={styles.tooltipText}>{number(selected.weightKg)} {t('kgShort')} × {selected.reps}</Text><Text style={styles.tooltipText}>{selected.date}</Text><Text style={styles.tooltipText}>RPE: {selected.rpe ?? '—'} · {t('analyticsFailure')}: {selected.isFailure ? t('yes') : t('no')}</Text><Text style={styles.tooltipText}>{t('analyticsSetNumber')}: {selected.setNumber ?? '—'}</Text></View> : null}</View>
        </View>
        {selected?.workoutId ? <Pressable accessibilityRole="button" onPress={openWorkout} style={styles.cta}><Text style={styles.ctaText}>{t('analyticsViewWorkout')}</Text></Pressable> : null}
      </>}
    </ScrollView>
  </SafeAreaView>;
}
