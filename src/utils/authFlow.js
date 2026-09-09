export const UNKNOWN_USER_CODE = 'USER_NOT_FOUND';

export function isUnknownUserError(error) {
  return error?.details?.code === UNKNOWN_USER_CODE;
}

export async function completeRegistration({
  displayName,
  email,
  password,
  register,
  persistEmail,
  navigate,
}) {
  await register(email, password, displayName);
  await persistEmail(email).catch(() => {});
  navigate(email);
}

export async function completeVerification({
  code,
  email,
  verify,
  clearPendingEmail,
  navigate,
}) {
  await verify(email, code);
  await clearPendingEmail().catch(() => {});
  navigate(email);
}

export function createUnknownUserCountdown({
  seconds = 5,
  tickMs = 1000,
  onTick,
  onComplete,
}) {
  let active = false;
  let remaining = 0;
  let timer;

  const schedule = () => {
    timer = setTimeout(() => {
      if (!active) return;
      if (remaining === 1) {
        active = false;
        timer = undefined;
        onComplete();
        return;
      }
      remaining -= 1;
      onTick(remaining);
      schedule();
    }, tickMs);
  };

  return {
    start() {
      if (active) return false;
      active = true;
      remaining = seconds;
      onTick(remaining);
      schedule();
      return true;
    },
    cancel() {
      active = false;
      remaining = 0;
      clearTimeout(timer);
      timer = undefined;
    },
    isActive() {
      return active;
    },
  };
}
