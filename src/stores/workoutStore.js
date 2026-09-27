import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { apiFetch, apiRequest } from '../services/api';
import { mergeWorkoutExercises, programExercises } from '../utils/library';
import storage from './workoutStorage';

const initial = {
  activeWorkout: null,
  loggedSets: [],
  preparedWorkout: null,
  isLoading: false,
  historyRevision: 0,
  lastFinishedWorkoutId: null,
  userId: null,
  userToken: null,
  // Not persisted (see partialize below): true once checkActiveWorkout has settled for the
  // current session, so UI can avoid flashing a stale rehydrated activeWorkout before the
  // server has confirmed whether it is still active.
  activeVerified: false,
};
let generation = 0;
let activeCheck = 0;

export const useWorkoutStore = create(persist((set, get) => ({
  ...initial,
  setSession: (userId, userToken) => {
    const previous = get().userId;
    if (previous !== userId) {
      generation++;
      activeCheck++;
      set({ ...initial, userId, userToken });
    } else if (get().userToken !== userToken) set({ userToken });
  },
  reset: () => {
    generation++;
    activeCheck++;
    set(initial);
    void useWorkoutStore.persist.clearStorage();
  },
  setActiveWorkout: (value) => {
    activeCheck++;
    set((state) => ({ activeWorkout: typeof value === 'function' ? value(state.activeWorkout) : value }));
  },
  setLoggedSets: (value) => set((state) => ({ loggedSets: typeof value === 'function' ? value(state.loggedSets) : value })),
  prepareWorkout: (value) => set((state) => ({ preparedWorkout: typeof value === 'function' ? value(state.preparedWorkout) : value })),
  clearPreparedWorkout: () => set({ preparedWorkout: null }),
  checkActiveWorkout: async () => {
    const { userToken } = get();
    if (!userToken) return;
    const current = generation;
    const request = ++activeCheck;
    try {
      set({ isLoading: true });
      const res = await apiFetch('/workouts/active', {}, userToken);
      if (current !== generation || request !== activeCheck) return;
      if (res.ok && res.data?.workout) set({ activeWorkout: res.data.workout, loggedSets: res.data.sets || [] });
      else if (res.ok) set({ activeWorkout: null, loggedSets: [] });
    } catch (error) {
      console.error('Error checking active workout:', error);
    } finally {
      // Mark verified on both success and failure so gated UI (e.g. the active-workout banner)
      // stops waiting; a stale/superseded call (guarded below) must not verify the new session.
      if (current === generation && request === activeCheck) set({ isLoading: false, activeVerified: true });
    }
  },
  startWorkout: async (type = 'HIT Session', scheduleId = null, prepared = null) => {
    const { userToken } = get();
    if (!userToken) return null;
    const current = generation;
    activeCheck++;
    try {
      set({ isLoading: true });
      const res = await apiFetch('/workouts/start', {
        method: 'POST',
        body: JSON.stringify({
          type,
          ...(scheduleId ? { scheduleId } : {}),
          ...(prepared?.programId ? { programId: prepared.programId } : {}),
          ...(prepared?.exercises?.length ? { plan: prepared.exercises.map((item) => ({
            exerciseId: item.id,
            sets: Number(item.sets) || 0,
            reps: item.reps == null ? undefined : Number(item.reps),
            weight: item.weight == null ? undefined : Number(item.weight),
          })) } : {}),
        }),
      }, userToken);
      if (current !== generation) return null;
      if (res.ok && res.data) {
        const workout = res.data.workout || res.data;
        set({ activeWorkout: workout, loggedSets: [] });
        return workout;
      }
    } catch (error) {
      console.error('Error starting workout:', error);
    } finally {
      if (current === generation) set({ isLoading: false });
    }
    return null;
  },
  finishWorkout: async (notes = '') => {
    const { activeWorkout, userToken } = get();
    if (!activeWorkout) return false;
    const current = generation;
    activeCheck++;
    try {
      set({ isLoading: true });
      const res = await apiFetch(`/workouts/${activeWorkout.id}/finish`, { method: 'POST', body: JSON.stringify({ notes: notes || '' }) }, userToken);
      if (current !== generation) return false;
      if (res.ok) {
        set((state) => ({ activeWorkout: null, loggedSets: [], preparedWorkout: null, historyRevision: state.historyRevision + 1, lastFinishedWorkoutId: activeWorkout.id }));
        return res.data?.workout || true;
      }
    } catch (error) {
      console.error('Error finishing workout:', error);
    } finally {
      if (current === generation) set({ isLoading: false });
    }
    return false;
  },
  cancelWorkout: async () => {
    const { activeWorkout, userToken } = get();
    if (!activeWorkout) return;
    const current = generation;
    activeCheck++;
    try {
      await apiFetch(`/workouts/${activeWorkout.id}/cancel`, { method: 'POST' }, userToken);
    } catch (error) {
      console.error('Error canceling workout:', error);
    } finally {
      if (current === generation) set({ activeWorkout: null, loggedSets: [], preparedWorkout: null });
    }
  },
  togglePauseWorkout: async () => {
    const { activeWorkout, userToken } = get();
    if (!activeWorkout) return null;
    const current = generation;
    activeCheck++;
    const res = await apiFetch(`/workouts/${activeWorkout.id}/pause`, { method: 'POST' }, userToken);
    if (current !== generation) return null;
    if (res.ok && res.data?.workout) {
      set({ activeWorkout: res.data.workout });
      return res.data.workout;
    }
    return null;
  },
  heartbeatActiveWorkout: async () => {
    const { activeWorkout, userToken } = get();
    if (!activeWorkout?.id || activeWorkout.status !== 'active') return null;
    const current = generation;
    try {
      const res = await apiFetch(`/workouts/${activeWorkout.id}/heartbeat`, { method: 'POST' }, userToken);
      if (current !== generation || get().activeWorkout?.id !== activeWorkout.id) return null;
      if (res.ok && res.data?.workout) {
        set({ activeWorkout: res.data.workout });
        return res.data.workout;
      }
    } catch (error) {
      console.error('Error updating workout activity:', error);
    }
    return null;
  },
  addWorkoutExercises: async (items, title = 'Workout', programId = null) => {
    const { activeWorkout, preparedWorkout, userToken } = get();
    const current = generation;
    // Read activeCheck without bumping it: a finish/cancel/start (which do bump it) must be able
    // to cancel this pending restore, but this restore must not cancel unrelated concurrent reads
    // (e.g. an in-flight checkActiveWorkout) just because it also touches the workout store.
    const request = activeCheck;
    let restored = null;
    if (!preparedWorkout && activeWorkout?.programId) {
      const program = await apiRequest(`/workout-programs/${activeWorkout.programId}`, {}, userToken);
      restored = { title: program.name, programId: program.id, exercises: programExercises(program) };
    }
    if (current !== generation || request !== activeCheck) return;
    set((state) => {
      const base = state.preparedWorkout || restored || { title: state.activeWorkout?.type || title, exercises: [] };
      return { preparedWorkout: { ...base, programId: base.programId || programId || null, exercises: mergeWorkoutExercises(base.exercises || [], items) } };
    });
  },
}), {
  name: 'workout-state',
  storage: createJSONStorage(() => storage),
  partialize: ({ userId, activeWorkout, loggedSets, preparedWorkout }) => ({ userId, activeWorkout, loggedSets, preparedWorkout }),
  skipHydration: true,
}));
