// EN: Proves the production contract for one persisted installation UUID under concurrent reads and generation; fixtures model user-visible behavior and integration boundaries rather than implementation details.
// UK: Перевіряє робочий контракт одного збереженого UUID інсталяції за одночасного читання та генерування; фікстури відтворюють поведінку користувача й межі інтеграції, а не деталі реалізації.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getInstallationId } from '../src/utils/installationId.js';

test('an existing app installation keeps one UUID across simultaneous checks', async () => {
  const id = '328f90c4-7fa6-46d6-8cb6-1ba743b3c1a2';
  let stored = null;
  let generated = 0;
  const storage = {
    getItem: async () => stored,
    setItem: async (_key, value) => { stored = value; },
  };
  const randomUUID = () => { generated += 1; return id; };

  assert.deepEqual(
    await Promise.all([
      getInstallationId(storage, randomUUID),
      getInstallationId(storage, randomUUID),
    ]),
    [id, id],
  );
  assert.equal(stored, id);
  assert.equal(generated, 1);
  assert.equal(await getInstallationId(storage, randomUUID), id);
});
