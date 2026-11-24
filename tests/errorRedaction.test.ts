import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSanitizedFirestoreErrorInfo,
  getFriendlyErrorMessage,
  scrubSensitiveText,
} from '../src/utils/errorUtils.js';

test('buildSanitizedFirestoreErrorInfo omits user email and provider email PII', () => {
  const err = new Error('Missing or insufficient permissions for user@example.com');
  (err as unknown as { code: string }).code = 'permission-denied';

  const info = buildSanitizedFirestoreErrorInfo(
    err,
    'update',
    'users/uid_123',
    {
      uid: 'uid_123',
      emailVerified: true,
      isAnonymous: false,
      providerData: [{ providerId: 'google.com' }, { providerId: 'password' }],
    }
  );

  const serialized = JSON.stringify(info);
  assert.equal(serialized.includes('user@example.com'), false);
  assert.equal('email' in info.authInfo, false);
  assert.deepEqual(info.authInfo.providerIds, ['google.com', 'password']);
  assert.equal(info.errorCode, 'permission-denied');
});

test('getFriendlyErrorMessage never leaks raw JSON or emails from FirestoreErrorInfo errors', () => {
  const info = buildSanitizedFirestoreErrorInfo(
    new Error('PERMISSION_DENIED: Missing or insufficient permissions'),
    'get',
    'users/uid_secret/tasks/t1',
    { uid: 'uid_secret', emailVerified: false, isAnonymous: false, providerData: [] }
  );
  const thrown = new Error(JSON.stringify(info));
  const friendly = getFriendlyErrorMessage(thrown);

  assert.equal(friendly.includes('uid_secret'), false);
  assert.equal(friendly.includes('operationType'), false);
  assert.match(friendly, /Permission denied/i);
});

test('scrubSensitiveText redacts emails and strips stack traces', () => {
  const scrubbed = scrubSensitiveText(
    'Failed for student.name+1@university.edu\n    at Object.<anonymous> (/app/src/index.ts:12:5)'
  );
  assert.equal(scrubbed.includes('student.name+1@university.edu'), false);
  assert.equal(scrubbed.includes('/app/src/index.ts'), false);
  assert.equal(scrubbed, 'Failed for [redacted-email]');
});
