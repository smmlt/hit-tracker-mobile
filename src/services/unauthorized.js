// EN: Registers the single global handler that turns an unrecoverable authenticated 401 response into local session cleanup.
// UK: Реєструє єдиний глобальний handler, який після невідновлюваної авторизованої відповіді 401 очищає локальну сесію.
let handler = null;
let refreshHandler = null;
let refreshPromise = null;
let accountSuspendedHandler = null;

export const setUnauthorizedHandler = (nextHandler) => {
  handler = nextHandler;
};

export const notifyUnauthorized = () => handler?.();

export const setRefreshHandler = (nextHandler) => {
  refreshHandler = nextHandler;
};

export const refreshAccessToken = () => {
  if (!refreshHandler) return Promise.resolve(null);
  if (!refreshPromise) {
    refreshPromise = Promise.resolve(refreshHandler()).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

export const setAccountSuspendedHandler = (nextHandler) => {
  accountSuspendedHandler = nextHandler;
};

export const notifyAccountSuspended = (details) => accountSuspendedHandler?.(details);
