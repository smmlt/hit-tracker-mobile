import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  chartPoints,
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

test('body metrics translation keys exist in both supported locales', () => {
  const keys = ['bodyMetrics', 'bodyMetricsDetails', 'addMeasurement', 'bodyMetricOutOfRange', 'percentageShort', 'weekdayMon'];
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
  assert.equal(formatMetric(74, 'weight', 'uk'), '74,0 кг');
  assert.equal(formatMetric(74, 'weight', 'en'), '74.0 kg');
  assert.equal(formatMetric(74, 'waistCircumference', 'uk'), '74 см');
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
  assert.equal(formatMetricDelta(0.3, 'muscleMass', 'uk'), '+0,3 кг');
  assert.equal(formatMetricDelta(-0.5, 'weight', 'en'), '-0.5 kg');
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
