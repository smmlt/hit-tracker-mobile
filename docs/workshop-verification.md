# Workshop and admin verification — 2026-09-03

## Implemented

- Shared exercise and program cards based on Figma nodes `2627:5711`, `2627:5774`, `2627:6231`, `2627:6314` in `erdroE9J99n0pwgA8Nbgjy`.
- Inter fonts and exported SVG assets are local files; no expiring Figma URLs at runtime.
- Workshop exercise/program tabs, search, muscle/type/saved filters, sorting, program and exercise details.
- Navigation stack preserves the originating screen: Workshop → exercise → Back; Workshop → program → exercise → Back to program.
- Program customization creates a personal copy; editing one's own copy updates it.
- Program scheduling supports one date or weekly repetition. Updating an official program creates a revision; existing assignments keep their previous program ID.
- Admin lists actual exercises, not just a create form. Searchable program/exercise cards open details and separate editors. Personal programs show their owner and are read-only in the admin panel.
- User management is restricted to admin/super-admin; existing server role and deletion protections remain in force. Delete confirmation uses a native modal so it appears above the account editor.
- Exercise likes/bookmarks and program likes persist on the server. Additional migration: `20260906090000_add_library_reactions` in the backend repository.
- Adding exercises from Workshop updates the shared workout plan without modifying the original program. The return banner stays above the bottom tab bar.

## Checks run

- Backend: `npm run build`; `npm test -- --runInBand` — 19 tests passed.
- Frontend: `node --test tests/library.test.mjs` — 2 tests passed.
- Expo: `npx expo export --platform all --output-dir .expo-workshop-check` — web, Android and iOS bundles built successfully.
- In-app browser: admin list/search, required-name validation, creating and editing an exercise, creating an official program with weekday/sets/reps/weight, detail/back navigation, persisted likes/bookmarks after reload, invalid-date validation, weekly scheduling, personal copying, official revision isolation, adding to the workout and returning through the banner.
- Visually inspected the app at a 430px phone viewport and admin at a 902px viewport.
- No real accounts were deleted or roles changed during UI checks. Role restrictions and private-program protections also have server-side tests.
- With the user's approval, removed all created QA fixtures: exercise #71, programs #7/#8/#9, workout #86 and their dependent QA assignments/reactions. Normal user data was retained.

## Data/design boundaries

- Database names/descriptions remain in their original language. Interface labels support English and Ukrainian.
- The current schema has no image uploads, program duration, or primary/secondary muscle classification. Media slots remain neutral placeholders where content is absent. Existing video URLs are used; duration and anatomy facts are not invented.
- Android/iOS checks were bundle compilation, not device/simulator runtime tests.

## Follow-up: difficulty and translucent navigation — 2026-09-03

- Exercise cards now display exactly five bars: levels 1–5 fill one through five bars in green, lime, yellow, orange and red respectively. Inactive bars are gray. The admin editor previews the same shared indicator.
- The database/API already support levels 1–5; existing saved values were not remapped. Frontend tests cover every color/count; backend create/update DTO tests reject zero, six, negative and fractional difficulty values.
- The workout banner and tab bar share a single bottom overlay. Its measured height includes the safe-area inset and feeds React Navigation's standard bottom-bar height context. Scrollable pages reserve enough space to reveal their final controls; fixed workout/profile controls stay above the overlay.
- Checked in the in-app browser at 430 × 932: all five difficulty levels in Workshop and admin preview, program-card difficulty, banner return navigation, and docking on Home, History, Profile, Analytics and the prepared-workout screen. Tab bar: bottom 932px, top 860px; banner bottom 860px. Removing the preparation returns the dock from about 129px to 72px.
- The preview form was closed without saving. The temporary prepared workout was cancelled before starting; no database test records were created by these checks.
- Checks: frontend `node --test tests/library.test.mjs` (3 passed); backend `npm test -- --runInBand` (21 passed); Expo Web/Android/iOS exports passed. Native runtime/device testing remains separate.

Manual regression: open a program, add it to the current workout without starting, switch tabs, and return using the banner. Confirm the banner touches the top of the tab bar, the tab bar touches the viewport bottom, and the last screen controls remain reachable. Cancel the preparation, then open the admin exercise form and cycle 1/5 through 5/5 without saving.

## Follow-up: one program is one workout — 2026-09-03

- Removed legacy weekday badges and per-exercise weekday/week/weight captions from program cards and details. Exercise footers show sets × reps only.
- Program editors expose sets/reps only. Existing legacy metadata is preserved for API compatibility; no database migration or history rewrite was performed. The scheduling form still selects the date and weekly repetition for the whole program.
- Workshop, calendar and restored-session program imports now use the same `programExercises` conversion, without prescribed weights. The workout weight input starts empty; actual logged weights and history are unchanged.
- In-app browser: verified HIT Classic Full Body details, the customization form, Sunday selection (2026-09-06) without saving, and preparation of all three exercises with three empty weight inputs. Cancelled the preparation before starting and returned to the program.
- Frontend: 4 tests passed, including a regression covering old weekday/weight metadata in both official and personal programs. Backend: 21 tests passed. Web, Android and iOS bundles built successfully; no native device run was performed.
