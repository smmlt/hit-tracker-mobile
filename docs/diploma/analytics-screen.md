# Analytics screen and CQRS read models

The Analytics tab reads `GET /analytics/me/summary`, `/weekly-volume?weeks=12`, and `/personal-records` through the main API proxy. The summary card shows this and last week volume and workout counts, volume delta, current and longest streak, PR count, and last workout. The bar chart uses the 12 weekly read-model rows. Tapping a PR reads `/analytics/me/exercises/:exerciseId/progress` and charts top-set weight and estimated 1RM; exercise names come from the library store, with a localized ID fallback.

The existing body-metrics preview and details continue using `/users/me/body-metrics` via `bodyMetricsService`; the new CQRS body-metrics endpoint is exposed by `analyticsService` but is not used by this screen. The preview remains accessible even if analytics is unavailable.

After a successful finish, the workout store keeps the finished workout ID in memory. On focus and pull-to-refresh the screen fetches all read models. If the summary's `lastWorkout.workoutId` is older, it displays “Updating statistics…” and retries twice after 700 ms and 1400 ms. The hint remains if the projection is still behind; another focus or refresh retries. Pending responses and timers are ignored/cancelled when the screen loses focus, the user changes, or a newer refresh starts. A `503 ANALYTICS_UNAVAILABLE` response shows a friendly message and Retry; users with no workouts see an empty state.

## Screenshot placeholders

- New user empty state and body-metrics preview
- Populated summary, weekly chart, and personal records
- Expanded exercise progress chart
- Updating statistics after workout finish
- Analytics service unavailable with Retry
