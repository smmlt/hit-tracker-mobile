# Backend Implementation Prompt: Analytics Read Models

Implement the backend changes needed to support the mobile analytics overview and its strength, intensity, and muscle-balance drill-down pages. Make code changes in the analytics read service, add focused tests, and report any data the current backend cannot derive reliably. Do not change the mobile app as part of this task.

Before editing, read this repository's `AGENTS.md` and relevant architecture/setup documentation. Trace the analytics read path and inspect its existing response conventions and data sources. In the current gateway, `src/analytics-proxy` is an authenticated wildcard pass-through to the analytics service configured by `ANALYTICS_URL`; it contains no analytics business logic and already forwards `/analytics/*`. Do not add duplicate gateway routes or implement read-model logic in the proxy. If the analytics service source is outside the current backend repository, identify the correct service repository instead of adding nonfunctional proxy stubs.

All added routes are authenticated `GET` requests under `/analytics/me`. Verify the bearer token in the read service and scope every query to its subject. Validate query parameters and inclusive date boundaries; use the user's local calendar for day-based queries and consistent date semantics for range queries.

## Add These Endpoints

### `GET /analytics/me/overview?from=<ISO>&to=<ISO>`

Implement the period overview. `from` and `to` are required inclusive date-time bounds. Return the summary, activity/compliance series, intensity trend, and muscle-group overview in this shape:

```json
{
  "summary": {
    "workouts": 4,
    "plannedWorkouts": 5,
    "completedWorkouts": 4,
    "activeMinutes": 260,
    "workingSets": 82,
    "volumeKg": 18500,
    "caloriesKcal": 345,
    "averageRpe": 7.1
  },
  "activity": [
    {
      "date": "2026-08-21",
      "volumeKg": 4200,
      "plannedWorkouts": 1,
      "completedWorkouts": 1
    }
  ],
  "intensityTrend": [{ "date": "2026-08-21", "averageRpe": 6.5 }],
  "muscleGroups": [
    { "muscleId": 1, "name": "Legs", "workingSets": 24, "volumeKg": 5100, "percentage": 29 }
  ]
}
```

`activity` drives the period activity/compliance and volume graphs. `intensityTrend` drives the overview intensity sparkline. `muscleGroups` drives the compact overview distribution. Derive values from persisted workout and schedule data. For genuinely unavailable optional measurements use `null` or an empty array consistently; do not invent data or report a missing value as a measured zero.

### `GET /analytics/me/intensity?date=YYYY-MM-DD`

Implement the day-intensity detail. Validate `date` as `YYYY-MM-DD` and calculate it in the user's local calendar. Return `averageRpe`, `volumePerMinute`, `setsToFailure`, `totalSets`, and `rpeDistribution`. Each distribution entry contains `range` (for example `4-5`), `sets`, and `percentage` (0-100). The average volume-per-minute denominator must use active training time, not elapsed time including rests. Define how sets with no RPE or failure value are handled and cover that behavior in tests.

### `GET /analytics/me/muscle-groups?from=<ISO>&to=<ISO>&metric=workingSets|volume`

Implement the muscle-group aggregation. Validate `metric` against `workingSets` and `volume`; return all groups ordered descending by that metric. The response is `{ "muscleGroups": [...] }`; each item contains `muscleId`, catalog `name`, `workingSets`, `volumeKg`, and `percentage`. `percentage` is the selected group's share of the selected metric total. Define the zero-total behavior, and use the same muscle identity/name convention as the rest of the API. The UI uses this for both the working-set and volume views.

### `GET /analytics/me/exercises/:exerciseId/sets?from=<ISO>&to=<ISO>`

Implement the user's set-level exercise history. Parse and validate `exerciseId`, scope returned workout sets to the authenticated user, and apply the inclusive range. Return completed working sets ordered by completion time. Each set contains `date`, `workoutId`, `weightKg`, `reps`, and optional `rpe`/`isFailure`. The scatter graph plots repetitions on X and weight in kilograms on Y. Exclude warm-up/non-working sets unless existing product rules explicitly classify them as working sets.

## Preserve Existing Client Contracts

These routes are already called by the mobile app and are not new requirements for this UI change; preserve their response contracts:

- `GET /analytics/me/summary`: weekly summary, streak, latest workout, and record count.
- `GET /analytics/me/weekly-volume?weeks=12`: weekly volume series.
- `GET /analytics/me/personal-records`: per-exercise records.
- `GET /analytics/me/exercises/:exerciseId/progress?from=<ISO>&to=<ISO>`: dated top-set weight and estimated 1RM points.
- `GET /users/me/body-metrics?from=<ISO>&to=<ISO>`: body-metric history used by the existing body-metrics page.

Keep the existing contracts listed above backward compatible while implementing these additions.

## Implementation And Verification

- Reuse the analytics service's existing query/read-model architecture and database schema. Add migrations only if the required data truly is not represented; do not infer schedule completion, calories, RPE, or failure from unrelated fields.
- Use the backend's established DTO/query validation, authentication, error-envelope, and logging conventions. Return stable JSON for empty datasets and reject invalid ranges/metrics with the repository's standard client error.
- Add focused service/controller tests for every new endpoint, including valid aggregation, empty results, inclusive date boundaries, invalid query values, and user-data isolation. Mock the external analytics service only at established integration boundaries; do not weaken authentication.
- Run the focused tests, then the backend test/typecheck/lint/build commands required by `AGENTS.md`. Do not claim database-backed verification unless it was run against a migrated database.
- In the completion report, list changed files, the response contracts implemented, any schema migrations, validation commands/results, and any data fields that could not be calculated from current sources.

The gateway wildcard route already forwards new `/analytics/*` paths, so no gateway route registration is needed. Implement these read models in the analytics service itself.