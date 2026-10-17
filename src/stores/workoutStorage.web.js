// EN: Implements the persisted-workout adapter over browser localStorage with the interface expected by Zustand persistence.
// UK: Реалізує адаптер збереження workout через browser localStorage з інтерфейсом, якого очікує Zustand persistence.
export default {
  getItem: (name) => globalThis.localStorage?.getItem(name) ?? null,
  setItem: (name, value) => globalThis.localStorage?.setItem(name, value),
  removeItem: (name) => globalThis.localStorage?.removeItem(name),
};
