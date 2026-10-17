# Mobile data flows / Потоки даних мобільного застосунку

## English

### Authenticated API request

1. A screen or Zustand action calls a domain service.
2. The service delegates the HTTP details to the shared API client.
3. The API client attaches the access token and request metadata.
4. If the access token has expired, one shared refresh operation obtains a new token; concurrent failed requests wait for that operation instead of creating several refreshes.
5. The original request is retried once. A terminal unauthorized response clears only the currently registered session and returns the user to the authentication flow.
6. Services normalize transport errors so screens can render stable domain messages and retry actions.

This separation keeps token lifecycle logic out of screens and prevents a group of simultaneous requests from racing to rotate the same refresh token.

### Workout lifecycle

`WorkoutSetupScreen` prepares a local workout plan. The workout store persists that plan with its owning user ID. Starting the workout creates or restores the server session; `ActiveWorkoutScreen` records confirmed sets and keeps drafts separate from persisted results. Pause, resume, finish, and cancel actions update the store only after the corresponding service boundary settles.

At application startup, persisted state is available immediately, but a rehydrated active workout remains hidden until `checkActiveWorkout` verifies it against the backend. This prevents a session finished on another device from briefly appearing as active. A network failure does not destroy the local copy, allowing a later retry.

### Library and search

Library screens request exercises and programs through the library store. The store owns loading state, merges server responses, and updates reactions only on the matching item. Search requests can be cancelled or superseded so a slower old response cannot overwrite the newest query. Official catalog names pass through localization; user-created names remain unchanged.

### Navigation and deep links

The root navigator chooses a route tree from authentication, onboarding, and suspension state. Deep-link helpers encode stable paths for exercises, programs, dates, and supported notification destinations. Incoming notification URLs are validated against an allowlist before navigation; malformed, deceptive, or unsupported links are rejected.

### State ownership rule

Use local component state for short-lived presentation details, React context for application-wide lifecycle state, Zustand for shared domain state with selective subscriptions, and backend persistence for authoritative multi-device data. This rule prevents the same fact from having several competing owners.

## Українською

### Автентифікований запит до API

1. Екран або дія Zustand викликає доменний сервіс.
2. Сервіс передає HTTP-деталі спільному API-клієнту.
3. API-клієнт додає токен доступу та метадані запиту.
4. Якщо токен доступу прострочений, одна спільна операція оновлення отримує новий токен; паралельні невдалі запити очікують на неї, а не створюють кілька оновлень.
5. Початковий запит повторюється один раз. Остаточна неавторизована відповідь очищає лише зареєстровану поточну сесію й повертає користувача до процесу автентифікації.
6. Сервіси нормалізують транспортні помилки, щоб екрани могли показувати стабільні доменні повідомлення та дії повторної спроби.

Такий поділ прибирає керування життєвим циклом токенів з екранів і не дозволяє групі одночасних запитів конкурувати за ротацію одного refresh-токена.

### Життєвий цикл тренування

`WorkoutSetupScreen` готує локальний план тренування. Сховище тренування зберігає цей план разом з ідентифікатором власника. Запуск тренування створює або відновлює серверну сесію; `ActiveWorkoutScreen` записує підтверджені підходи й тримає чернетки окремо від збережених результатів. Дії паузи, продовження, завершення та скасування змінюють сховище лише після завершення відповідного виклику сервісу.

Під час запуску застосунку збережений стан доступний одразу, але відновлене активне тренування залишається прихованим, доки `checkActiveWorkout` не перевірить його через backend. Це не дозволяє тренуванню, завершеному на іншому пристрої, короткочасно зʼявитися як активне. Помилка мережі не знищує локальну копію, тому перевірку можна повторити пізніше.

### Бібліотека й пошук

Екрани бібліотеки отримують вправи та програми через сховище бібліотеки. Сховище володіє станом завантаження, обʼєднує відповіді сервера й оновлює реакції лише для відповідного елемента. Пошуковий запит можна скасувати або замінити новішим, тому повільна стара відповідь не перезапише актуальний результат. Офіційні назви каталогу проходять локалізацію, а створені користувачами назви не змінюються.

### Навігація та глибокі посилання

Кореневий навігатор вибирає дерево маршрутів за станом автентифікації, початкового налаштування та блокування. Допоміжні функції глибоких посилань кодують стабільні шляхи для вправ, програм, дат і підтримуваних цілей сповіщень. URL зі сповіщення перевіряється за списком дозволених адрес до навігації; неправильні, оманливі або непідтримувані посилання відхиляються.

### Правило володіння станом

Локальний стан компонента використовується для короткочасних деталей представлення, React Context — для глобального стану життєвого циклу, Zustand — для спільного доменного стану з вибірковими підписками, а backend — для авторитетних даних між кількома пристроями. Це правило не дозволяє одному факту мати кількох конкуруючих власників.
