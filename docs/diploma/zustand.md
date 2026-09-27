# Zustand state migration

Workout and library state now live in `src/stores/workoutStore.js` and `src/stores/libraryStore.js`. Zustand selectors let the banner watch only workout status and plan, and let library cards watch only the catalog fields they use. The old Context providers sent every update to every consumer; the new stores also remove provider nesting from `App.js`.

The workout store persists the prepared plan, active workout, logged sets, and owning user ID. Web uses `localStorage`; iOS and Android use the already installed AsyncStorage. Tokens are kept out of persisted state. Auth initialization checks the saved owner before showing the navigator, and logout clears the saved workout. A successful active-workout fetch reconciles local state with the server; a network failure leaves the saved workout available until retry.

To demo: sign in, prepare a workout in Workshop, reload, and see the prepared banner and session plan. Start it, record a set, reload, and confirm the active session returns. Pause and resume, finish or cancel, then reload to confirm the banner is gone. Log out, sign in as another account, and confirm the previous plan never appears. Switch language and inspect localized exercise and program names in the library.
