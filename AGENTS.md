# Mobile instructions

Scope: the Expo SDK 57 / React Native application for web, Android, and iOS. Use the exact [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/) matching `package.json`; do not apply older SDK guidance. For product scope read `../docs/PRODUCT_SPEC/README.md`; for the system map read `../docs/ARCHITECTURE.md`.

## Organization and dependencies

- Entry/composition is `index.js` → `App.js` providers → `src/navigation/AppNavigator.js`.
- Screen orchestration belongs in `src/screens/`; reusable UI belongs in `src/components/<domain>/`; shared behavior belongs in `src/hooks/`, `src/services/`, `src/utils/`, and contexts.
- The project is organized around screens/components, not a `features/` tree. Do not introduce a parallel feature architecture for one task.
- Global state is held by `AuthContext`, `WorkoutContext`, `LibraryContext`, `ThemeContext`, and `LanguageContext`. Keep local UI/form state on the screen unless multiple consumers need it.

## Navigation and user flows

- Route names and auth/main switching are defined in `AppNavigator`. Check nested Workshop/Training/Profile stacks, bottom-tab behavior, deep links, and Back/replace semantics.
- Registration does not end at a successful API response: it navigates to `VerifyEmail`; verification returns to Login. Login/OAuth must end with persisted token/user state and the correct root-navigator switch.
- Workout preparation is not Start. Preserve prepared/active/paused/completed/cancelled distinctions, the active-workout banner, and transitions between Workshop, Training, and the session.
- For history/analytics/training changes, select the relevant functional and design PDFs through the PRODUCT_SPEC index and inspect both source and destination screens.

## API, forms, and feedback

- Use `src/services/api.js` as the HTTP boundary: Bearer headers, JSON/error normalization, `Retry-After`, and global 401 logout already exist. Add a narrow domain service when an endpoint is reused; a one-off call may follow the existing `apiRequest`/`apiFetch` pattern.
- Do not swallow actionable failures. Screens need coherent loading, empty, error, and retry states, and must not apply stale responses after user/filter/query changes.
- Reuse `src/utils/validation.js`, profile-form hooks, and backend error codes/details. Client validation improves UX but never replaces server validation.
- Shared toast and confirm UI lives in `src/components/feedback/`. Clean up timers/animations on unmount; destructive actions need explicit confirmation and a visible result.

## UI and accessibility

- Use tokens from `src/constants/colors.js` through `ThemeContext`, Inter fonts, and the nearest common/domain components. Do not create a second color/button/card system inside one screen without a design-spec requirement.
- Preserve English/Ukrainian localization through `LanguageContext`; new user-visible strings must not remain inline in one language only.
- Interactive controls need an accessible role/label, readable contrast, web focus/keyboard behavior, adequate touch targets, and reachable final content above the tab bar/banner/safe area.
- Keep platform-specific media implementations in `.web.js`/`.native.js`; check both branches when their shared interface changes.

## Validation

- Pure-JS regressions: `node --test "tests/*.test.mjs"` or nearest `node --test tests/<file>.test.mjs`.
- Web bundle: `npx expo export --platform web --output-dir <temporary-directory>`.
- Cross-platform bundle: `npx expo export --platform all --output-dir <temporary-directory>`; this checks compilation, not a device/simulator flow.
- `npm run start`/`npm run web` start a long-lived dev server; they are not test suites.
- No lint, formatter, typecheck, or UI/E2E scripts are configured. Do not claim they ran; for a meaningful UI flow add an available regression test and perform a manual/runtime check on affected platforms.

Auth, navigation, workout lifecycle, destructive actions, and storage changes require success/error/loading-state, cleanup, and return/restart checks. Report bundle export separately from real browser/device validation.
