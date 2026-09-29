import assert from 'node:assert/strict';
import test from 'node:test';
import { getPathFromState, getStateFromPath } from '@react-navigation/core';
import { linkingConfig } from '../src/navigation/linkingConfig.js';
import { entityId, entityRef, isoDate, routeSlug } from '../src/utils/navigationPaths.js';

const nestedState = (tab, screen, params) => ({
  routes: [{
    name: 'MainApp',
    state: {
      routes: [{ name: tab, state: { routes: [{ name: screen, params }] } }],
    },
  }],
});

const leafName = (state) => {
  const route = state.routes[state.index ?? state.routes.length - 1];
  return route.state ? leafName(route.state) : route.name;
};

test('navigation path helpers build readable stable references', () => {
  assert.equal(routeSlug('  Жим штанги / Bench Press  '), 'жим-штанги-bench-press');
  assert.equal(routeSlug('---'), 'item');
  assert.equal(entityRef('HIT Classic Full Body', 42), 'hit-classic-full-body--42');
  assert.equal(entityId('hit-classic-full-body--42'), 42);
  assert.equal(entityId('42'), 42);
  assert.equal(entityId('hit-classic-full-body'), null);
  assert.equal(isoDate('2026-09-29T23:00:00-05:00'), '2026-09-29');
  assert.equal(isoDate('invalid'), 'unknown-date');
});

test('authenticated nested routes generate canonical public URLs', () => {
  assert.equal(
    getPathFromState(nestedState('Home', 'WorkshopHome'), linkingConfig),
    '/workshop',
  );
  assert.equal(
    getPathFromState(nestedState('Home', 'ExerciseDetails', { exerciseRef: 'bench-press--1' }), linkingConfig),
    '/workshop/exercises/bench-press--1',
  );
  assert.equal(
    getPathFromState(nestedState('Profile', 'Settings'), linkingConfig),
    '/profile/settings',
  );
  assert.equal(
    getPathFromState(nestedState('ActiveWorkout', 'TrainingHome', { date: '2026-09-29' }), linkingConfig),
    '/training/2026-09-29',
  );
  assert.equal(
    getPathFromState(nestedState('History', 'HistoryDetails', { date: '2026-09-29', workoutRef: 'hit-classic--7' }), linkingConfig),
    '/history/2026-09-29/hit-classic--7',
  );
  assert.equal(
    getPathFromState(nestedState('ActiveWorkout', 'WorkoutPreparation'), linkingConfig),
    '/workout/preparation',
  );
  assert.equal(
    getPathFromState(nestedState('ActiveWorkout', 'WorkoutSession'), linkingConfig),
    '/active-workout',
  );
  assert.equal(
    getPathFromState(nestedState('ActiveWorkout', 'WorkoutCompleted', { date: '2026-09-29', workoutRef: 'hit-classic--7' }), linkingConfig),
    '/workout/completed/2026-09-29/hit-classic--7',
  );
  assert.equal(
    getPathFromState(nestedState('Analytics', 'AddBodyMeasurement'), linkingConfig),
    '/analytics/body-metrics/new',
  );
});

test('legacy generated URLs still resolve to their original screens', () => {
  const settings = getStateFromPath('/MainApp/Profile/Settings', linkingConfig);
  const workshop = getStateFromPath('/MainApp/Home/WorkshopHome', linkingConfig);
  assert.equal(leafName(settings), 'Settings');
  assert.equal(leafName(workshop), 'WorkshopHome');
});

test('unknown URLs resolve to the not-found screen', () => {
  assert.equal(leafName(getStateFromPath('/does-not-exist', linkingConfig)), 'NotFound');
});
