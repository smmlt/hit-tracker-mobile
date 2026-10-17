# Mobile application architecture / Архітектура мобільного застосунку

## English

### Purpose

The Expo application is the presentation and interaction layer of Hit Tracker. It runs on Android, iOS, and the web from one React Native codebase. The client never accesses PostgreSQL or Elasticsearch directly: it sends authenticated HTTP requests to the NestJS backend and converts the responses into screen state.

### Startup and global providers

`index.js` registers `App.js` as the Expo entry component. `App.js` creates the provider hierarchy used by every screen:

1. safe-area and gesture providers establish platform-specific layout and gesture handling;
2. `LanguageProvider` restores the selected interface language;
3. `AuthProvider` restores the session, coordinates token refresh, and connects the authenticated user to the Zustand stores;
4. `NavigationContainer` and `RootNavigator` select the public, onboarding, authenticated, or suspended-account route tree;
5. global banners and notification handlers display state that must remain visible across screens.

This order is intentional. Navigation must not decide which route tree to show before language, persisted stores, and authentication have reached a known state.

### Folder responsibilities

| Folder | Responsibility | Typical dependency direction |
| --- | --- | --- |
| `src/screens` | Composes complete user flows and visible loading, empty, error, and success states. | components, hooks, stores, services, utilities |
| `src/components` | Reusable visual and interaction building blocks. | constants, localization, small utilities |
| `src/navigation` | Route trees, deep links, and transitions between public and protected areas. | context, screens, link utilities |
| `src/context` | Cross-cutting React state whose lifecycle surrounds the entire application. | services, stores, persistence |
| `src/stores` | Zustand domain state for the workout and library flows. | services, storage adapters, utilities |
| `src/services` | HTTP, authentication, upload, notification, and platform integration boundaries. | configuration and low-level utilities |
| `src/hooks` | Reusable lifecycle and data-loading behavior shared by screens. | context, services, stores |
| `src/utils` | Pure validation, normalization, calculation, link, and presentation helpers. | usually no UI dependencies |
| `src/localization` | Supported locales, translation dictionary, and catalog-name localization. | consumed by all presentation layers |
| `src/constants` | Shared design tokens and stable application constants. | consumed throughout the client |

### How to explain a screen during the defense

Start from the visible user action, then trace one direction through the system:

`screen → reusable component/hook → store or service → backend endpoint → normalized result → screen state`.

For example, the History screen asks the workout service for a cursor-based page. The service performs the authenticated request. The screen de-duplicates returned workouts, keeps the next cursor, and renders loading or retry states. When the user reaches the end of the list, the same contract loads the next page without replacing already visible history.

### Important design boundaries

- Access and refresh tokens are controlled by the authentication layer; screens do not implement token refresh themselves.
- Persisted workout state includes an owner identifier so one user cannot see another user's local session after account switching.
- Platform-specific files such as `.web.js` isolate browser behavior from Android/iOS behavior while preserving one public import.
- Localization uses identical keys for English and Ukrainian. Missing catalog translations fall back to the server-provided name instead of hiding content.
- Utilities keep validation and calculations outside UI components, making the domain rules testable without rendering React Native screens.

## Українською

### Призначення

Застосунок Expo є рівнем представлення та взаємодії Hit Tracker. Він працює на Android, iOS і у веббраузері з однієї кодової бази React Native. Клієнт не звертається безпосередньо до PostgreSQL або Elasticsearch: він надсилає автентифіковані HTTP-запити до backend на NestJS і перетворює відповіді на стан екранів.

### Запуск і глобальні провайдери

`index.js` реєструє `App.js` як початковий компонент Expo. `App.js` формує ієрархію провайдерів для всіх екранів:

1. провайдери безпечної області та жестів налаштовують платформозалежну розмітку й обробку жестів;
2. `LanguageProvider` відновлює вибрану мову інтерфейсу;
3. `AuthProvider` відновлює сесію, координує оновлення токенів і повʼязує автентифікованого користувача зі сховищами Zustand;
4. `NavigationContainer` і `RootNavigator` вибирають дерево публічних, початкових, автентифікованих маршрутів або маршрутів заблокованого облікового запису;
5. глобальні банери та обробники сповіщень показують стан, який має бути видимим на різних екранах.

Такий порядок навмисний. Навігація не повинна вибирати дерево маршрутів, доки мова, збережені сховища та автентифікація не перейшли у відомий стан.

### Відповідальність папок

| Папка | Відповідальність | Типовий напрям залежностей |
| --- | --- | --- |
| `src/screens` | Поєднує повні користувацькі сценарії та видимі стани завантаження, порожніх даних, помилки й успіху. | компоненти, хуки, сховища, сервіси, утиліти |
| `src/components` | Повторно використовувані візуальні та інтерактивні блоки. | константи, локалізація, невеликі утиліти |
| `src/navigation` | Дерева маршрутів, глибокі посилання й переходи між публічною та захищеною частинами. | контексти, екрани, утиліти посилань |
| `src/context` | Наскрізний React-стан, життєвий цикл якого охоплює весь застосунок. | сервіси, сховища, локальне збереження |
| `src/stores` | Доменний стан Zustand для тренувань і бібліотеки. | сервіси, адаптери сховища, утиліти |
| `src/services` | Межі HTTP, автентифікації, завантаження файлів, сповіщень і платформних інтеграцій. | конфігурація та низькорівневі утиліти |
| `src/hooks` | Повторно використовувана логіка життєвого циклу й завантаження даних. | контексти, сервіси, сховища |
| `src/utils` | Чисті функції валідації, нормалізації, обчислень, посилань і представлення. | зазвичай без залежностей від UI |
| `src/localization` | Підтримувані мови, словник перекладів і локалізація назв каталогу. | використовується всіма рівнями представлення |
| `src/constants` | Спільні дизайн-токени та стабільні константи застосунку. | використовується в усьому клієнті |

### Як пояснювати екран під час захисту

Почніть із видимої дії користувача, а потім простежте один напрям через систему:

`екран → повторно використовуваний компонент або хук → сховище чи сервіс → endpoint backend → нормалізований результат → стан екрана`.

Наприклад, екран History запитує у сервісу тренувань сторінку за курсором. Сервіс виконує автентифікований запит. Екран усуває дублікати тренувань, зберігає наступний курсор і показує стани завантаження або повторної спроби. Коли користувач доходить до кінця списку, той самий контракт завантажує наступну сторінку, не замінюючи вже видиму історію.

### Важливі архітектурні межі

- Токени доступу й оновлення контролює рівень автентифікації; екрани не реалізують оновлення токенів самостійно.
- Збережений стан тренування містить ідентифікатор власника, тому після зміни облікового запису один користувач не побачить локальну сесію іншого.
- Платформозалежні файли на кшталт `.web.js` відокремлюють поведінку браузера від Android/iOS, зберігаючи єдиний публічний імпорт.
- Локалізація використовує однакові ключі для англійської та української. Якщо перекладу назви каталогу немає, застосунок показує отриману від сервера назву, а не приховує вміст.
- Утиліти виносять валідацію та обчислення з UI-компонентів, тому доменні правила можна тестувати без рендерингу екранів React Native.
