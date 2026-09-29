import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { transformSync } from '@babel/core';

const require = createRequire(import.meta.url);
const storageItems = new Map();
const fakeStorage = {
  getItem: (key) => storageItems.get(key) ?? null,
  setItem: (key, value) => { storageItems.set(key, value); },
  removeItem: (key) => { storageItems.delete(key); },
};

function loadStore(file, api = {}) {
  const source = readFileSync(new URL(`../src/stores/${file}`, import.meta.url), 'utf8');
  const code = transformSync(source, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
  const module = { exports: {} };
  const dependencies = {
    '../services/api': api,
    '../utils/library': {
      mergeWorkoutExercises: (current, items) => [...current, ...items],
      programExercises: (program) => program.schedule,
    },
    './workoutStorage': fakeStorage,
  };
  runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) => dependencies[name] || require(name),
    console,
  }, { filename: file });
  return module.exports;
}

test('workout actions preserve lifecycle and only persist workout data', async () => {
  storageItems.clear();
  const paths = [];
  const apiFetch = async (path) => {
    paths.push(path);
    if (path === '/workouts/start') return { ok: true, data: { workout: { id: 5, status: 'active' } } };
    if (path.endsWith('/pause')) return { ok: true, data: { workout: { id: 5, status: 'paused' } } };
    if (path.endsWith('/finish')) return { ok: true, data: { workout: { id: 5, status: 'completed' } } };
    return { ok: true, data: null };
  };
  const { useWorkoutStore: store } = loadStore('workoutStore.js', { apiFetch, apiRequest: async () => ({}) });
  store.getState().setSession(7, 'secret-token');
  store.getState().prepareWorkout({ title: 'Legs', exercises: [{ id: 2, sets: 3 }] });
  assert.equal(store.getState().activeWorkout, null);
  assert.equal(JSON.parse(storageItems.get('workout-state')).state.preparedWorkout.title, 'Legs');
  assert.equal(storageItems.get('workout-state').includes('secret-token'), false);
  await store.getState().startWorkout('Legs');
  store.getState().setLoggedSets((sets) => [...sets, { id: 1 }]);
  await store.getState().togglePauseWorkout();
  assert.equal(store.getState().activeWorkout.status, 'paused');
  assert.deepEqual(Array.from(store.getState().loggedSets, (set) => set.id), [1]);
  await store.getState().finishWorkout('done');
  assert.equal(store.getState().activeWorkout, null);
  assert.equal(store.getState().lastFinishedWorkoutId, 5);
  assert.equal(store.getState().preparedWorkout, null);
  assert.equal(store.getState().historyRevision, 1);
  assert.deepEqual(paths, ['/workouts/start', '/workouts/5/pause', '/workouts/5/finish']);
});

test('persisted workout rehydrates and logout prevents another user seeing it', async () => {
  storageItems.clear();
  const api = { apiFetch: async () => ({ ok: true, data: null }), apiRequest: async () => ({}) };
  const first = loadStore('workoutStore.js', api).useWorkoutStore;
  first.getState().setSession(7, 'token-a');
  first.getState().prepareWorkout({ title: 'Draft', exercises: [] });
  first.getState().setActiveWorkout({ id: 10, status: 'active' });
  first.getState().setCompletedWorkoutResult({ title: 'Previous workout' });
  const restarted = loadStore('workoutStore.js', api).useWorkoutStore;
  await restarted.persist.rehydrate();
  assert.equal(restarted.getState().preparedWorkout.title, 'Draft');
  assert.equal(restarted.getState().activeWorkout.id, 10);
  assert.equal(restarted.getState().completedWorkoutResult.title, 'Previous workout');
  restarted.getState().reset();
  restarted.getState().setSession(8, 'token-b');
  assert.equal(restarted.getState().activeWorkout, null);
  assert.equal(restarted.getState().completedWorkoutResult, null);
  assert.equal(restarted.getState().lastFinishedWorkoutId, null);
  assert.equal(restarted.getState().preparedWorkout, null);
  assert.equal(JSON.parse(storageItems.get('workout-state')).state.activeWorkout, null);
  assert.equal(JSON.parse(storageItems.get('workout-state')).state.preparedWorkout, null);
});

test('old workout and library requests cannot populate a new session', async () => {
  storageItems.clear();
  let finishWorkout;
  const workout = loadStore('workoutStore.js', {
    apiFetch: () => new Promise((resolve) => { finishWorkout = resolve; }),
    apiRequest: async () => ({}),
  }).useWorkoutStore;
  workout.getState().setSession(7, 'a');
  const pendingWorkout = workout.getState().checkActiveWorkout();
  workout.getState().reset();
  workout.getState().setSession(8, 'b');
  finishWorkout({ ok: true, data: { workout: { id: 99 } } });
  await pendingWorkout;
  assert.equal(workout.getState().activeWorkout, null);

  let finishExercises;
  const library = loadStore('libraryStore.js', {
    apiRequest: (path) => path === '/exercises'
      ? new Promise((resolve) => { finishExercises = resolve; })
      : Promise.resolve([]),
  }).useLibraryStore;
  library.getState().setSession(7, 'a');
  library.getState().setSession(null, null);
  finishExercises([{ id: 99 }]);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(Array.from(library.getState().exercises), []);
});

test('late active lookup cannot erase a newly started workout', async () => {
  storageItems.clear();
  let finishLookup;
  const store = loadStore('workoutStore.js', {
    apiFetch: (path) => path === '/workouts/active'
      ? new Promise((resolve) => { finishLookup = resolve; })
      : Promise.resolve({ ok: true, data: { workout: { id: 5, status: 'active' } } }),
    apiRequest: async () => ({}),
  }).useWorkoutStore;
  store.getState().setSession(7, 'a');
  const lookup = store.getState().checkActiveWorkout();
  await store.getState().startWorkout();
  finishLookup({ ok: true, data: null });
  await lookup;
  assert.equal(store.getState().activeWorkout.id, 5);
});

test('addWorkoutExercises resolving after finish/cancel does not resurrect preparedWorkout', async () => {
  storageItems.clear();
  let finishProgramLookup;
  const api = {
    apiFetch: async (path) => {
      if (path.endsWith('/finish')) return { ok: true, data: { workout: { id: 5 } } };
      if (path.endsWith('/cancel')) return { ok: true, data: null };
      return { ok: true, data: null };
    },
    apiRequest: (path) => path.startsWith('/workout-programs/')
      ? new Promise((resolve) => { finishProgramLookup = resolve; })
      : Promise.resolve({}),
  };
  const { useWorkoutStore: store } = loadStore('workoutStore.js', api);
  store.getState().setSession(7, 'token');
  store.getState().setActiveWorkout({ id: 5, status: 'active', programId: 3 });

  const addition = store.getState().addWorkoutExercises([{ id: 9, sets: 1 }]);
  assert.equal(store.getState().preparedWorkout, null);
  await store.getState().finishWorkout('done');
  assert.equal(store.getState().activeWorkout, null);
  assert.equal(store.getState().preparedWorkout, null);

  finishProgramLookup({ id: 3, name: 'Legs', schedule: [] });
  await addition;
  assert.equal(store.getState().preparedWorkout, null);

  const persisted = JSON.parse(storageItems.get('workout-state'));
  assert.equal(persisted.state.preparedWorkout, null);
});

test('addWorkoutExercises resolving after cancelWorkout does not resurrect preparedWorkout', async () => {
  storageItems.clear();
  let finishProgramLookup;
  const api = {
    apiFetch: async () => ({ ok: true, data: null }),
    apiRequest: (path) => path.startsWith('/workout-programs/')
      ? new Promise((resolve) => { finishProgramLookup = resolve; })
      : Promise.resolve({}),
  };
  const { useWorkoutStore: store } = loadStore('workoutStore.js', api);
  store.getState().setSession(7, 'token');
  store.getState().setActiveWorkout({ id: 5, status: 'active', programId: 3 });

  const addition = store.getState().addWorkoutExercises([{ id: 9, sets: 1 }]);
  await store.getState().cancelWorkout();
  assert.equal(store.getState().activeWorkout, null);
  assert.equal(store.getState().preparedWorkout, null);

  finishProgramLookup({ id: 3, name: 'Legs', schedule: [] });
  await addition;
  assert.equal(store.getState().preparedWorkout, null);
});

test('activeVerified is unpersisted and only settles once checkActiveWorkout finishes', async () => {
  storageItems.clear();
  let resolveLookup;
  let rejectLookup;
  const api = {
    apiFetch: (path) => path === '/workouts/active'
      ? new Promise((resolve, reject) => { resolveLookup = resolve; rejectLookup = reject; })
      : Promise.resolve({ ok: true, data: null }),
    apiRequest: async () => ({}),
  };
  const { useWorkoutStore: store } = loadStore('workoutStore.js', api);

  store.getState().setSession(7, 'token');
  assert.equal(store.getState().activeVerified, false);

  const first = store.getState().checkActiveWorkout();
  assert.equal(store.getState().activeVerified, false);
  resolveLookup({ ok: true, data: { workout: { id: 1, status: 'active' } } });
  await first;
  assert.equal(store.getState().activeVerified, true);
  assert.equal(JSON.parse(storageItems.get('workout-state')).state.activeVerified, undefined);

  // A same-user access-token refresh (e.g. the ~5-minute refresh timer) must not re-hide the
  // banner: it is still the same verified session, just a new token.
  store.getState().setSession(7, 'token-b');
  assert.equal(store.getState().activeVerified, true);

  // A different user (real session change) must re-gate the UI until re-verified.
  store.getState().setSession(8, 'token-c');
  assert.equal(store.getState().activeVerified, false);

  const second = store.getState().checkActiveWorkout();
  rejectLookup(new Error('network down'));
  await second;
  assert.equal(store.getState().activeVerified, true);
});

test('library refresh and reaction update only the matching item', async () => {
  const store = loadStore('libraryStore.js', {
    apiRequest: async (path) => {
      if (path === '/exercises') return [{ id: 1, likesCount: 0, isLiked: false }, { id: 2, likesCount: 3, isLiked: false }];
      if (path === '/workout-programs' || path === '/exercises/muscles') return [];
      return { isLiked: true };
    },
  }).useLibraryStore;
  store.getState().setSession(7, 'a');
  await store.getState().refresh();
  await store.getState().react('exercises', 1);
  assert.equal(store.getState().exercises[0].likesCount, 1);
  assert.equal(store.getState().exercises[1].likesCount, 3);
  store.getState().setSession(null, null);
  assert.deepEqual(Array.from(store.getState().exercises), []);
});

test('web storage adapter delegates to localStorage', async () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = fakeStorage;
  try {
    const { default: webStorage } = await import('../src/stores/workoutStorage.web.js');
    webStorage.setItem('key', 'value');
    assert.equal(webStorage.getItem('key'), 'value');
    webStorage.removeItem('key');
    assert.equal(webStorage.getItem('key'), null);
  } finally {
    globalThis.localStorage = previous;
  }
});
