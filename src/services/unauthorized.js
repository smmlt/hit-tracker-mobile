let handler = null;

export const setUnauthorizedHandler = (nextHandler) => {
  handler = nextHandler;
};

export const notifyUnauthorized = () => handler?.();
