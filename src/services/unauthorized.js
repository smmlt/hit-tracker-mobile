let handler = null;
let refreshHandler = null;
let refreshPromise = null;

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
