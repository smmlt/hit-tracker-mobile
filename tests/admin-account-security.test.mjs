import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('admin profile exposes guarded session and suspension actions', () => {
  const screen = source('src/screens/AdminScreen.js');
  const details = source('src/components/admin/AdminUserDetails.js');
  const service = source('src/services/adminService.js');

  assert.match(screen, /verifiedRole === "super_admin"/);
  assert.match(screen, /!detailUser\.isSystemOwner/);
  assert.match(screen, /isSystemOwner \|\| detailUser\.role !== "super_admin"/);
  assert.match(details, /adminService\.revokeUserSessions/);
  assert.match(details, /adminService\.suspendUser/);
  assert.match(details, /adminService\.unsuspendUser/);
  assert.match(details, /revokeUserSessionsConfirmMessage/);
  assert.match(service, /\/admin\/users\/\$\{id\}\/revoke-sessions/);
  assert.match(service, /\/admin\/users\/\$\{id\}\/suspend/);
  assert.match(service, /\/admin\/users\/\$\{id\}\/unsuspend/);
});

test('ACCOUNT_BANNED responses clear auth and route to the suspension screen', () => {
  const api = source('src/services/api.js');
  const auth = source('src/context/AuthContext.js');
  const navigator = source('src/navigation/AppNavigator.js');

  assert.match(api, /data\?\.code === 'ACCOUNT_BANNED'/);
  assert.match(api, /notifyAccountSuspended\(data\)/);
  assert.match(auth, /setAccountSuspendedHandler\(handleAccountSuspended\)/);
  assert.match(auth, /await clearAuth\(\)/);
  assert.match(navigator, /name="AccountSuspended"/);
});
