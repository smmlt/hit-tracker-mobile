# Analytics screen and CQRS read models / Екран аналітики та моделі читання CQRS

## English

The Analytics tab reads `GET /analytics/me/summary`, `/weekly-volume?weeks=12`, and `/personal-records` through the main API proxy. The summary card shows this and last week volume and workout counts, volume delta, current and longest streak, PR count, and last workout. The bar chart uses the 12 weekly read-model rows. Tapping a PR reads `/analytics/me/exercises/:exerciseId/progress` and charts top-set weight and estimated 1RM; exercise names come from the library store, with a localized ID fallback.

The existing body-metrics preview and details continue using `/users/me/body-metrics` via `bodyMetricsService`; the new CQRS body-metrics endpoint is exposed by `analyticsService` but is not used by this screen. The preview remains accessible even if analytics is unavailable.

After a successful finish, the workout store keeps the finished workout ID in memory. On focus and pull-to-refresh the screen fetches all read models. If the summary's `lastWorkout.workoutId` is older, it displays “Updating statistics…” and retries twice after 700 ms and 1400 ms. The hint remains if the projection is still behind; another focus or refresh retries. Pending responses and timers are ignored/cancelled when the screen loses focus, the user changes, or a newer refresh starts. A `503 ANALYTICS_UNAVAILABLE` response shows a friendly message and Retry; users with no workouts see an empty state.

## Screenshot placeholders

- New user empty state and body-metrics preview
- Populated summary, weekly chart, and personal records
- Expanded exercise progress chart
- Updating statistics after workout finish
- Analytics service unavailable with Retry

## Українською

Вкладка Analytics отримує `GET /analytics/me/summary`, `/weekly-volume?weeks=12` і `/personal-records` через основний API-проксі. Підсумкова картка показує обсяг і кількість тренувань за цей та минулий тиждень, зміну обсягу, поточну й найдовшу серію, кількість особистих рекордів та останнє тренування. Стовпчикова діаграма використовує 12 тижневих рядків моделі читання. Натискання на особистий рекорд завантажує `/analytics/me/exercises/:exerciseId/progress` і будує графіки найбільшої ваги підходу та розрахункового 1RM; назви вправ беруться зі сховища бібліотеки, а за їх відсутності використовується локалізований варіант з ідентифікатором.

Наявний попередній перегляд і деталі показників тіла продовжують використовувати `/users/me/body-metrics` через `bodyMetricsService`; новий endpoint показників тіла CQRS доступний через `analyticsService`, але цей екран його не використовує. Попередній перегляд залишається доступним, навіть коли аналітика недоступна.

Після успішного завершення сховище тренування тримає в памʼяті ідентифікатор завершеного тренування. Під час фокусування та оновлення жестом екран завантажує всі моделі читання. Якщо `lastWorkout.workoutId` у підсумку відстає, екран показує «Оновлення статистики…» і двічі повторює запит через 700 та 1400 мс. Підказка залишається, якщо проєкція ще не оновилася; наступне фокусування або ручне оновлення запускає нову спробу. Очікувані відповіді й таймери ігноруються або скасовуються, коли екран втрачає фокус, користувач змінюється чи починається новіше оновлення. Відповідь `503 ANALYTICS_UNAVAILABLE` показує зрозуміле повідомлення та дію повторної спроби; користувачі без тренувань бачать порожній стан.

### Кадри, які варто показати на захисті

- Порожній стан нового користувача та попередній перегляд показників тіла.
- Заповнений підсумок, тижневий графік і особисті рекорди.
- Розгорнутий графік прогресу вправи.
- Оновлення статистики після завершення тренування.
- Недоступний сервіс аналітики з дією повторної спроби.
