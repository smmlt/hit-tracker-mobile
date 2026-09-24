import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  chartLabelPositions,
  chartLayout,
  chartPoints,
  dateInputToIso,
  formatMetric,
  formatMetricDelta,
  formatRangeLabel,
  metricState,
  measurementList,
  periodToDateRange,
  validateBodyMeasurement,
} from '../src/utils/bodyMetrics.js';
import { translations } from '../src/localization/translations.js';

const now = new Date(2026, 7, 28, 12, 0, 0);
const tFor = (locale) => (key) => translations[locale][key];
const uk = tFor('uk');
const en = tFor('en');

test('body metrics translation keys exist in both supported locales', () => {
  const keys = Object.keys(translations.en).filter((key) => /^(bodyMetric|addMeasurement|measurement|weekday|kgShort|cmShort|percentageShort)/.test(key));
  assert.ok(keys.length > 40);
  for (const key of keys) {
    assert.equal(typeof translations.en[key], 'string');
    assert.equal(typeof translations.uk[key], 'string');
  }
});

test('periods use local day boundaries and clamp future custom dates', () => {
  const range = periodToDateRange('7', now);
  assert.equal(range.start, '2026-08-21');
  assert.equal(range.end, '2026-08-28');
  assert.equal(new Date(range.from).getHours(), 0);
  assert.equal(new Date(range.to).getHours(), 23);
  const clamped = periodToDateRange({ start: '2026-08-30', end: '2026-09-02' }, now);
  assert.equal(clamped.start, '2026-08-28');
  assert.equal(clamped.end, '2026-08-28');
  assert.equal(clamped.from, periodToDateRange('today', now).from);
  assert.equal(clamped.to, periodToDateRange('today', now).to);
});

test('range labels and locale values use the requested language', () => {
  const range = { start: '2026-08-21', end: '2026-08-28' };
  assert.equal(formatRangeLabel(range, 'uk'), '21 - 28 серпня 2026');
  assert.equal(formatMetric(74, 'weight', 'uk', uk), '74,0 кг');
  assert.equal(formatMetric(74, 'weight', 'en', en), '74.0 kg');
  assert.equal(formatMetric(74, 'waistCircumference', 'uk', uk), '74 см');
});

test('metric states distinguish zero, one, and chart-ready points', () => {
  assert.equal(metricState({ points: [] }).status, 'empty');
  assert.equal(metricState({ points: [], latest: { value: 74 } }).hasLatestOutsidePeriod, true);
  assert.equal(metricState({ points: [{ value: 74, recordedAt: '2026-08-21T10:00:00Z' }] }).status, 'single');
  assert.equal(metricState({ points: [{ value: 74 }, { value: 73.5 }] }).status, 'chart');
});

test('measurement list is newest first with neutral signed deltas', () => {
  const points = [
    { value: 74.5, recordedAt: '2026-08-21T10:00:00Z' },
    { value: 74.4, recordedAt: '2026-08-23T10:00:00Z' },
    { value: 74, recordedAt: '2026-08-28T10:00:00Z' },
  ];
  assert.deepEqual(measurementList({ points }).map(({ value, delta }) => ({ value, delta })), [
    { value: 74, delta: -0.4 }, { value: 74.4, delta: -0.1 }, { value: 74.5, delta: null },
  ]);
  assert.equal(formatMetricDelta(0.3, 'muscleMass', 'uk', uk), '+0,3 кг');
  assert.equal(formatMetricDelta(-0.5, 'weight', 'en', en), '-0.5 kg');
});

test('chart points stay chronological and form validation matches the API ranges', () => {
  assert.deepEqual(chartPoints({ points: [
    { value: 74, recordedAt: '2026-08-28T10:00:00Z' },
    { value: 74.5, recordedAt: '2026-08-21T10:00:00Z' },
  ] }, 'en').map(({ value }) => value), [74.5, 74]);
  assert.equal(validateBodyMeasurement({ weight: '', bodyFatPercentage: '', muscleMass: '', waistCircumference: '' }, now).valid, false);
  assert.equal(validateBodyMeasurement({ weight: '19', bodyFatPercentage: '', muscleMass: '', waistCircumference: '' }, now).valid, false);
  assert.equal(validateBodyMeasurement({ weight: '74', bodyFatPercentage: '', muscleMass: '', waistCircumference: '', recordedAt: '2026-08-29' }, now).errors.futureDate, true);
  assert.equal(validateBodyMeasurement({ weight: '74', bodyFatPercentage: '', muscleMass: '', waistCircumference: '', recordedAt: '2026-08-28' }, now).valid, true);
});

test('units come from translations, including percent and centimetres', () => {
  assert.equal(formatMetric(18.5, 'bodyFatPercentage', 'uk', uk), '18,5 %');
  assert.equal(formatMetric(74, 'waistCircumference', 'en', en), '74 cm');
  assert.equal(formatMetricDelta(0.3, 'muscleMass', 'en', en), '+0.3 kg');
});

test('every metric has a grammatical trend title in both locales', () => {
  for (const key of ['Weight', 'Fat', 'Muscle', 'Waist']) {
    assert.equal(typeof translations.en[`bodyMetricsDynamics${key}`], 'string');
    assert.equal(typeof translations.uk[`bodyMetricsDynamics${key}`], 'string');
  }
  assert.equal(translations.uk.bodyMetricsDynamicsWeight, 'Динаміка ваги');
});

test('a measurement for today is never timestamped in the future', () => {
  const morning = new Date(2026, 7, 28, 8, 15, 0);
  assert.equal(dateInputToIso('2026-08-28', morning), morning.toISOString());
  assert.equal(new Date(dateInputToIso('2026-08-27', morning)).getHours(), 12);
});

test('chart layout lifts the baseline and spreads points across the width', () => {
  const layout = chartLayout([{ value: 74.5 }, { value: 74.4 }, { value: 74 }], 300);
  assert.ok(layout.yAxisOffset < 74 && layout.yAxisOffset > 73);
  assert.ok(Math.abs(layout.yAxisOffset + layout.maxValue - 74.625) < 1e-9);
  assert.equal(layout.spacing, (300 - layout.initialSpacing * 2) / 2);
  const flat = chartLayout([{ value: 74 }, { value: 74 }], 300);
  assert.ok(flat.maxValue > 0 && flat.yAxisOffset < 74);
});

test('chart labels sit under their points, stay inside the chart, and thin out', () => {
  const points = [{ value: 74.5, label: 'a' }, { value: 74.4, label: 'b' }, { value: 74, label: 'c' }];
  const layout = chartLayout(points, 300);
  const labels = chartLabelPositions(points, layout, 300, 56);
  assert.deepEqual(labels.map(({ index }) => index), [0, 1, 2]);
  assert.equal(labels[0].left, 0);
  assert.equal(labels[2].left, 300 - 56);
  assert.equal(labels[1].left, layout.initialSpacing + layout.spacing - 28);
  const many = Array.from({ length: 30 }, (_, index) => ({ value: 70 + index / 10, label: String(index) }));
  const thinned = chartLabelPositions(many, chartLayout(many, 300), 300, 56);
  assert.ok(thinned.length <= 5);
  assert.equal(thinned[0].index, 0);
  assert.equal(thinned.at(-1).index, 29);
});
