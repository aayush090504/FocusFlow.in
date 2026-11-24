import test from 'node:test';
import assert from 'node:assert/strict';
import {
  executeAccountDeletionWorkflow,
  getLinkedAuthProviders,
  AccountDeletionAdapter,
  AccountDeletionError,
  UserSubcollectionName,
} from '../src/services/accountDeletionService.js';

function createInMemoryAdapter(options: {
  linkedProviders?: ('password' | 'google.com')[];
  reauthShouldFail?: boolean;
  failBatchOnCallNumber?: number;
  docs?: Partial<Record<UserSubcollectionName, string[]>>;
}): {
  adapter: AccountDeletionAdapter;
  state: {
    operations: string[];
    authDeleted: boolean;
    profileDeleted: boolean;
    localCleared: boolean;
    remainingDocs: Record<UserSubcollectionName, string[]>;
  };
} {
  const remainingDocs: Record<UserSubcollectionName, string[]> = {
    subjects: [...(options.docs?.subjects ?? ['sub_1'])],
    tasks: [...(options.docs?.tasks ?? ['task_1'])],
    focusSessions: [...(options.docs?.focusSessions ?? ['sess_1'])],
    goals: [...(options.docs?.goals ?? ['goal_1'])],
  };

  let batchCallCount = 0;
  const state = {
    operations: [] as string[],
    authDeleted: false,
    profileDeleted: false,
    localCleared: false,
    remainingDocs,
  };

  const adapter: AccountDeletionAdapter = {
    uid: 'uid_test_1',
    linkedProviders: options.linkedProviders ?? ['password'],
    async reauthenticate(provider, password) {
      state.operations.push(`reauth:${provider}:${password ? 'pwd' : 'nopwd'}`);
      if (options.reauthShouldFail) {
        throw new Error('Authentication verification failed.');
      }
    },
    async fetchSubcollectionBatchIds(subcollection, batchSize) {
      state.operations.push(`fetch:${subcollection}`);
      return remainingDocs[subcollection].slice(0, batchSize);
    },
    async deleteSubcollectionBatch(subcollection, docIds) {
      batchCallCount += 1;
      state.operations.push(`deleteBatch:${subcollection}:${docIds.length}`);
      if (options.failBatchOnCallNumber && batchCallCount === options.failBatchOnCallNumber) {
        throw new Error('Simulated Firestore transient batch error');
      }
      const idSet = new Set(docIds);
      remainingDocs[subcollection] = remainingDocs[subcollection].filter((id) => !idSet.has(id));
    },
    async deleteUserProfileDoc() {
      state.operations.push('deleteProfile');
      state.profileDeleted = true;
    },
    async deleteAuthUser() {
      state.operations.push('deleteAuth');
      state.authDeleted = true;
    },
    clearLocalData() {
      state.operations.push('clearLocal');
      state.localCleared = true;
    },
  };

  return { adapter, state };
}

test('getLinkedAuthProviders extracts password and google.com cleanly', () => {
  assert.deepEqual(getLinkedAuthProviders([{ providerId: 'google.com' }]), ['google.com']);
  assert.deepEqual(
    getLinkedAuthProviders([{ providerId: 'password' }, { providerId: 'google.com' }, { providerId: 'password' }]),
    ['password', 'google.com']
  );
});

test('re-authentication failure aborts before touching Firestore or Auth user', async () => {
  const { adapter, state } = createInMemoryAdapter({
    linkedProviders: ['password'],
    reauthShouldFail: true,
    docs: { subjects: ['s1', 's2'], tasks: ['t1'] },
  });

  await assert.rejects(
    () => executeAccountDeletionWorkflow(adapter, { password: 'wrong-password' }),
    (err: unknown) => err instanceof AccountDeletionError && err.step === 'reauth'
  );

  assert.deepEqual(state.operations, ['reauth:password:pwd']);
  assert.equal(state.remainingDocs.subjects.length, 2);
  assert.equal(state.remainingDocs.tasks.length, 1);
  assert.equal(state.profileDeleted, false);
  assert.equal(state.authDeleted, false);
});

test('Google-only user reauthenticates via popup and deletes paginated subcollections before Auth deletion', async () => {
  const manySessions = Array.from({ length: 520 }, (_, i) => `sess_${i}`);
  const { adapter, state } = createInMemoryAdapter({
    linkedProviders: ['google.com'],
    docs: { focusSessions: manySessions },
  });

  const summary = await executeAccountDeletionWorkflow(adapter, { batchSize: 200 });

  assert.equal(summary.deletedSubcollectionDocs.focusSessions, 520);
  assert.equal(summary.profileDeleted, true);
  assert.equal(summary.authDeleted, true);
  assert.equal(state.localCleared, true);
  assert.equal(state.operations[0], 'reauth:google.com:nopwd');
  assert.ok(state.operations.indexOf('deleteProfile') < state.operations.indexOf('deleteAuth'));
  assert.equal(state.remainingDocs.focusSessions.length, 0);
});

test('multi-provider user supports choosing google.com or password reauthentication', async () => {
  const { adapter: googleChosen, state: s1 } = createInMemoryAdapter({
    linkedProviders: ['password', 'google.com'],
  });
  await executeAccountDeletionWorkflow(googleChosen, { preferredProvider: 'google.com' });
  assert.equal(s1.operations[0], 'reauth:google.com:nopwd');
  assert.equal(s1.authDeleted, true);

  const { adapter: passwordChosen, state: s2 } = createInMemoryAdapter({
    linkedProviders: ['password', 'google.com'],
  });
  await executeAccountDeletionWorkflow(passwordChosen, {
    preferredProvider: 'password',
    password: 'my-secret-password',
  });
  assert.equal(s2.operations[0], 'reauth:password:pwd');
  assert.equal(s2.authDeleted, true);
});

test('mid-batch failure preserves Auth account and allows idempotent retry', async () => {
  const sessions = Array.from({ length: 5 }, (_, i) => `sess_${i}`);
  const { adapter, state } = createInMemoryAdapter({
    linkedProviders: ['password'],
    failBatchOnCallNumber: 4, // fails mid-way on focusSessions after subjects(1), tasks(2), focusSessions first chunk(3)
    docs: { focusSessions: sessions },
  });

  await assert.rejects(
    () => executeAccountDeletionWorkflow(adapter, { password: 'pw', batchSize: 2 }),
    (err: unknown) => err instanceof AccountDeletionError && err.step === 'firestore' && err.canRetry === true
  );

  // Critical invariant: Auth user was NOT deleted when Firestore failed!
  assert.equal(state.authDeleted, false);
  assert.equal(state.profileDeleted, false);
  assert.equal(state.remainingDocs.focusSessions.length, 3);

  // Simulate user retrying: remaining docs delete cleanly and Auth account completes
  const retryResult = await executeAccountDeletionWorkflow(
    {
      ...adapter,
      async deleteSubcollectionBatch(sub, ids) {
        const idSet = new Set(ids);
        state.remainingDocs[sub] = state.remainingDocs[sub].filter((id) => !idSet.has(id));
      },
    },
    { password: 'pw', batchSize: 2 }
  );

  assert.equal(retryResult.deletedSubcollectionDocs.focusSessions, 3);
  assert.equal(state.profileDeleted, true);
  assert.equal(state.authDeleted, true);
  assert.equal(state.remainingDocs.focusSessions.length, 0);
});
