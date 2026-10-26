// EN: Proves the production contract for library catalog search, cancellation, filtering, and store response handling; fixtures model user-visible behavior and integration boundaries rather than implementation details.
// UK: Перевіряє робочий контракт пошуку в каталозі бібліотеки, скасування запитів, фільтрації та обробки відповіді у сховищі стану; фікстури відтворюють поведінку користувача й межі інтеграції, а не деталі реалізації.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { transformSync } from '@babel/core';

const require = createRequire(import.meta.url);

function load(api) {
  const source = readFileSync(new URL('../src/stores/libraryStore.js', import.meta.url), 'utf8');
  const code = transformSync(source, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
  const module = { exports: {} };
  runInNewContext(code, { module, exports: module.exports, console, URLSearchParams, AbortController,
    require: (name) => name === '../services/api' ? api : require(name),
  }, { filename: 'libraryStore.js' });
  return module.exports;
}

test('catalog search path encodes query and filters saved/private/muscle locally', async () => {
  const { buildCatalogSearchPath, filterCatalogLocally } = load({ apiRequest: async () => [] });
  assert.equal(buildCatalogSearchPath({ q: 'bench press/+', section: 'programs', scope: 'saved', muscle: 4, sort: 'relevance', locale: 'uk' }),
    '/catalog/search?q=bench+press%2F%2B&section=programs&scope=saved&sort=relevance&locale=uk&limit=25&muscle=4');
  assert.equal(buildCatalogSearchPath({ section: 'exercises', cursor: 'next/page' }),
    '/catalog/search?q=&section=exercises&scope=all&sort=popular&locale=en&limit=25&cursor=next%2Fpage');
  const state = { userId: 7, exercises: [{ id: 2, muscles: [{ id: 4 }] }], programs: [
    { id: 1, name: 'Saved', isLiked: true, isPersonal: true, createdById: 7, schedule: [{ exercise: { id: 2 } }] },
    { id: 2, name: 'Private other', isLiked: true, isPersonal: true, createdById: 8, schedule: [{ exercise: { id: 2 } }] },
  ] };
  const options = { section: 'programs', q: '', scope: 'saved', muscle: 4 };
  assert.deepEqual(filterCatalogLocally(state, options).map((item) => item.id), [1]);
  assert.deepEqual(filterCatalogLocally(state, { ...options, scope: 'personal' }).map((item) => item.id), [1]);
});

test('catalog pagination appends the next cursor page once and bypasses the web cache', async () => {
  const requests = [];
  const api = { apiRequest: async (path, options) => {
    requests.push({ path, options });
    return requests.length === 1
      ? { items: [{ id: 2 }], nextCursor: 'cursor-2' }
      : { items: [{ id: 2 }, { id: 1 }], nextCursor: null };
  } };
  const { useLibraryStore } = load(api);
  const store = useLibraryStore;
  store.setState({ userToken: 'token' });
  await store.getState().searchCatalog({ q: '', section: 'exercises' });
  await store.getState().loadMoreCatalog();
  assert.deepEqual(Array.from(store.getState().search.items, (item) => item.id), [2, 1]);
  assert.equal(store.getState().search.nextCursor, null);
  assert.match(requests[1].path, /cursor=cursor-2/);
  assert.equal(requests[0].options.cache, 'no-store');
  assert.equal(requests[1].options.cache, 'no-store');
});

test('searchCatalog ignores stale aborts and falls back without replacing local ordering', async () => {
  let firstSignal;
  const api = { apiRequest: (path, options) => path.includes('old')
    ? new Promise((resolve, reject) => { firstSignal = options.signal; options.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))); })
    : Promise.reject(Object.assign(new Error('down'), { status: 503, details: { code: 'SEARCH_UNAVAILABLE' } })) };
  const { useLibraryStore } = load(api);
  const store = useLibraryStore;
  store.getState().setSession(7, 'token');
  store.setState({ programs: [{ id: 2, name: 'Old', isLiked: false }, { id: 1, name: 'Saved', isLiked: true }] });
  const stale = store.getState().searchCatalog({ q: 'old', section: 'programs' });
  const fallback = store.getState().searchCatalog({ q: '', section: 'programs', scope: 'saved' });
  await fallback;
  await stale;
  assert.equal(firstSignal.aborted, true);
  assert.equal(store.getState().search.items, null);
  assert.equal(store.getState().search.fallback, true);
});

test('generic network failure keeps local fallback available with one error message', async () => {
  const { useLibraryStore } = load({ apiRequest: async () => { throw new Error('network down'); } });
  const store = useLibraryStore;
  store.setState({ programs: [{ id: 1, name: 'Saved', isLiked: true }] });
  await store.getState().searchCatalog({ q: '', section: 'programs', scope: 'saved' });
  assert.equal(store.getState().search.items, null);
  assert.equal(store.getState().search.fallback, false);
  assert.equal(store.getState().search.error, 'network down');
});

test('HomeScreen guards section results, keeps 275ms debounce, and accepts route relevance', () => {
  const source = readFileSync(new URL('../src/screens/HomeScreen.js', import.meta.url), 'utf8');
  assert.match(source, /\['relevance', 'alphabetical', 'newest'\]\.includes\(route\.params\?\.sort\)/);
  assert.match(source, /setTimeout\(\(\) => library\.searchCatalog[\s\S]*?, 275\)/);
  assert.match(source, /library\.search\?\.section === section && library\.search\?\.items/);
  assert.match(source, /onEndReached={library\.loadMoreCatalog}/);
});
