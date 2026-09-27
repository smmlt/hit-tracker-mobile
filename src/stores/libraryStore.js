import { create } from 'zustand';
import { apiRequest } from '../services/api';

let generation = 0;
const pending = new Set();
const empty = { exercises: [], programs: [], muscles: [], errors: {}, loading: false, userId: null, userToken: null };

export const useLibraryStore = create((set, get) => ({
  ...empty,
  setSession: (userId, userToken) => {
    if (get().userId === userId && (userId !== null || get().userToken === userToken)) {
      if (get().userToken !== userToken) set({ userToken });
      if (!get().loading && !get().exercises.length && userToken) void get().refresh();
      return;
    }
    generation++;
    pending.clear();
    set({ ...empty, userId, userToken });
    if (userToken) void get().refresh();
  },
  refresh: async () => {
    const { userToken } = get();
    const current = ++generation;
    if (!userToken) {
      set(empty);
      return;
    }
    set({ loading: true });
    const failures = {};
    await Promise.all([
      ['exercises', '/exercises'],
      ['programs', '/workout-programs'],
      ['muscles', '/exercises/muscles'],
    ].map(async ([key, path]) => {
      try {
        const data = await apiRequest(path, {}, userToken);
        if (current === generation) set({ [key]: data });
      } catch (error) {
        failures[key] = error.message;
      }
    }));
    if (current === generation) set({ errors: failures, loading: false });
  },
  react: async (kind, id, reaction = 'like') => {
    const key = `${kind}:${id}:${reaction}`;
    if (pending.has(key)) return;
    pending.add(key);
    const { userToken } = get();
    const current = generation;
    try {
      const data = await apiRequest(`/${kind === 'programs' ? 'workout-programs' : 'exercises'}/${id}/${reaction}`, { method: 'POST' }, userToken);
      if (current !== generation) return;
      set((state) => ({ [kind]: state[kind].map((item) => item.id === id ? {
        ...item,
        ...data,
        likesCount: reaction === 'like'
          ? Math.max(0, (item.likesCount || 0) + Number(data.isLiked) - Number(!!item.isLiked))
          : item.likesCount,
      } : item) }));
    } catch (error) {
      if (current === generation) set((state) => ({ errors: { ...state.errors, [kind]: error.message } }));
    } finally {
      pending.delete(key);
    }
  },
}));
