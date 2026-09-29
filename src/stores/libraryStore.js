import { create } from 'zustand';
import { apiRequest } from '../services/api';

let generation = 0;
let searchGeneration = 0;
let searchController = null;
const pending = new Set();
const empty = { exercises: [], programs: [], muscles: [], errors: {}, loading: false, userId: null, userToken: null, search: { items: null, section: null, loading: false, fallback: false, error: null } };

export const buildCatalogSearchPath = ({ q = '', section, scope = 'all', muscle, sort = 'popular', locale = 'en' }) => {
  const params = new URLSearchParams({ q, section, scope, sort, locale, limit: '25' });
  if (muscle) params.set('muscle', String(muscle));
  return `/catalog/search?${params.toString()}`;
};

const localCatalogFilter = ({ items, section, q, scope, muscle, userId, exercises }) => items.filter((item) => {
  if (q && ![item.name, item.displayName].some((name) => name?.toLowerCase().includes(q.toLowerCase()))) return false;
  if (section === 'programs') {
    if (item.isPersonal && item.createdById !== userId) return false;
    if (scope === 'personal' && (!item.isPersonal || item.createdById !== userId)) return false;
    if (scope === 'official' && item.isPersonal) return false;
    if (scope === 'saved' && !item.isLiked) return false;
    return !muscle || item.schedule?.some((row) => exercises.some((ex) => ex.id === row.exercise?.id && ex.muscles?.some((m) => m.id === muscle)));
  }
  return (scope !== 'saved' || item.isBookmarked) && (!muscle || item.muscles?.some((m) => m.id === muscle));
});

export const filterCatalogLocally = (state, options) => localCatalogFilter({
  ...options,
  items: options.items || state[options.section] || [],
  userId: state.userId,
  exercises: state.exercises,
});

export const useLibraryStore = create((set, get) => ({
  ...empty,
  setSession: (userId, userToken) => {
    if (get().userId === userId && (userId !== null || get().userToken === userToken)) {
      if (get().userToken !== userToken) set({ userToken });
      if (!get().loading && !get().exercises.length && userToken) void get().refresh();
      return;
    }
    generation++;
    searchGeneration++;
    searchController?.abort();
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
  searchCatalog: async (options) => {
    const { userToken } = get();
    const current = ++searchGeneration;
    searchController?.abort();
    const controller = new AbortController();
    searchController = controller;
    set({ search: { items: null, section: options.section, loading: true, fallback: false, error: null } });
    try {
      const data = await apiRequest(buildCatalogSearchPath(options), { signal: controller.signal }, userToken);
      if (current === searchGeneration) set({ search: { items: data?.items || [], section: options.section, loading: false, fallback: false, error: null } });
      return data?.items || [];
    } catch (error) {
      if (current !== searchGeneration || error.name === 'AbortError') return [];
      const unavailable = error.status === 503 && error.details?.code === 'SEARCH_UNAVAILABLE';
      const items = filterCatalogLocally(get(), options);
      set({ search: { items: null, section: options.section, loading: false, fallback: unavailable, error: unavailable ? null : error.message } });
      return items;
    }
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
