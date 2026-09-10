export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 24;

const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'moderator',
  'moder',
  'mod',
  'adm',
  'support',
  'staff',
  'help',
  'official',
  'system',
  'root',
  'owner',
  'hittracker',
  'hit_tracker',
]);

export function isReservedUsername(value) {
  return RESERVED_USERNAMES.has(value.trim().toLowerCase());
}

export function validateUsername(value) {
  const username = value.trim().toLowerCase();
  if (!username) return { valid: false, username, reason: 'empty' };
  if (username.length < MIN_USERNAME_LENGTH) {
    return { valid: false, username, reason: 'tooShort' };
  }
  if (username.length > MAX_USERNAME_LENGTH) {
    return { valid: false, username, reason: 'tooLong' };
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return { valid: false, username, reason: 'characters' };
  }
  if (isReservedUsername(username)) {
    return { valid: false, username, reason: 'reserved' };
  }
  return { valid: true, username, reason: null };
}

export function createUsernameAvailabilityController({ check, onState, delay = 400 }) {
  let revision = 0;
  let timer;
  let requestController;
  let disposed = false;

  const emit = (state) => {
    if (!disposed) onState(state);
  };

  const cancelPending = () => {
    clearTimeout(timer);
    requestController?.abort();
    requestController = undefined;
  };

  const update = (value) => {
    revision += 1;
    const currentRevision = revision;
    cancelPending();
    const validation = validateUsername(value);

    if (!validation.valid) {
      emit({
        status: validation.reason === 'empty' ? 'empty' : 'invalid',
        username: validation.username,
        reason: validation.reason,
      });
      return;
    }

    emit({ status: 'typing', username: validation.username, reason: null });
    timer = setTimeout(async () => {
      requestController = new AbortController();
      emit({ status: 'checking', username: validation.username, reason: null });
      try {
        const result = await check(validation.username, {
          signal: requestController.signal,
        });
        if (disposed || revision !== currentRevision) return;
        emit({
          status: result.available ? 'available' : 'taken',
          username: validation.username,
          reason: result.available ? null : 'taken',
        });
      } catch (error) {
        if (disposed || revision !== currentRevision || error?.name === 'AbortError') {
          return;
        }
        emit({
          status: 'error',
          username: validation.username,
          reason: 'request',
        });
      }
    }, delay);
  };

  return {
    update,
    markTaken(value) {
      revision += 1;
      cancelPending();
      emit({
        status: 'taken',
        username: validateUsername(value).username,
        reason: 'taken',
      });
    },
    dispose() {
      disposed = true;
      revision += 1;
      cancelPending();
    },
  };
}
