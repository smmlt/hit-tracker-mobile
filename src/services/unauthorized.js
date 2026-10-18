// EN: Registers the single global handler that turns an unrecoverable authenticated 401 response into local session cleanup.
// UK: Реєструє єдиний глобальний handler, який після невідновлюваної авторизованої відповіді 401 очищає локальну сесію.
let handler = null;
let refreshHandler = null;
let refreshPromise = null;
let accountSuspendedHandler = null;

// EN: Installs the AuthContext callback that clears local credentials when an authenticated request can no longer be recovered.
// UK: Встановлює callback з AuthContext, який очищає локальні облікові дані, коли авторизований запит уже неможливо відновити.
export const setUnauthorizedHandler = (nextHandler) => {
  handler = nextHandler;
};

// EN: Notifies the registered authentication owner about a terminal 401 without coupling the low-level API client to React state.
// UK: Повідомляє зареєстрованого власника стану автентифікації про остаточний 401, не зв'язуючи низькорівневий API-клієнт із React state.
export const notifyUnauthorized = () => handler?.();

// EN: Registers the function that knows how to exchange the current refresh credential for a new access token.
// UK: Реєструє функцію, яка вміє обміняти поточний refresh credential на новий access token.
export const setRefreshHandler = (nextHandler) => {
  refreshHandler = nextHandler;
};

// EN: Coalesces concurrent refresh attempts into one shared promise so simultaneous 401 responses cannot rotate the session multiple times.
// UK: Об'єднує паралельні refresh-спроби в один спільний promise, щоб одночасні відповіді 401 не виконали ротацію сесії декілька разів.
export const refreshAccessToken = () => {
  if (!refreshHandler) return Promise.resolve(null);
  if (!refreshPromise) {
    refreshPromise = Promise.resolve(refreshHandler()).finally(
      // EN: Releases the single-flight guard after success or failure so a later request may start a fresh refresh attempt.
      // UK: Знімає single-flight блокування після успіху або помилки, щоб наступний запит міг розпочати нову refresh-спробу.
      () => {
        refreshPromise = null;
      }
    );
  }
  return refreshPromise;
};

// EN: Installs the AuthContext callback that converts the backend suspension response into the dedicated blocked-account UI state.
// UK: Встановлює callback з AuthContext, який перетворює відповідь backend про suspension на окремий UI-стан заблокованого акаунта.
export const setAccountSuspendedHandler = (nextHandler) => {
  accountSuspendedHandler = nextHandler;
};

// EN: Forwards normalized suspension details to the session owner without making the transport layer navigate directly.
// UK: Передає нормалізовані деталі suspension власнику сесії, не змушуючи transport layer напряму виконувати navigation.
export const notifyAccountSuspended = (details) => accountSuspendedHandler?.(details);
