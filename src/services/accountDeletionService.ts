export type AuthProviderKind = 'password' | 'google.com';

export const USER_SUBCOLLECTIONS = ['subjects', 'tasks', 'focusSessions', 'goals'] as const;
export type UserSubcollectionName = (typeof USER_SUBCOLLECTIONS)[number];

export interface DeleteAccountOptions {
  password?: string;
  preferredProvider?: AuthProviderKind;
  batchSize?: number;
}

export interface AccountDeletionSummary {
  deletedSubcollectionDocs: Record<UserSubcollectionName, number>;
  profileDeleted: boolean;
  authDeleted: boolean;
}

export class AccountDeletionError extends Error {
  public readonly step: 'reauth' | 'firestore' | 'auth';
  public readonly canRetry: boolean;

  constructor(message: string, step: 'reauth' | 'firestore' | 'auth', canRetry = true) {
    super(message);
    this.name = 'AccountDeletionError';
    this.step = step;
    this.canRetry = canRetry;
  }
}

export interface AccountDeletionAdapter {
  uid: string;
  linkedProviders: AuthProviderKind[];
  reauthenticate: (provider: AuthProviderKind, password?: string) => Promise<void>;
  fetchSubcollectionBatchIds: (subcollection: UserSubcollectionName, batchSize: number) => Promise<string[]>;
  deleteSubcollectionBatch: (subcollection: UserSubcollectionName, docIds: string[]) => Promise<void>;
  deleteUserProfileDoc: () => Promise<void>;
  deleteAuthUser: () => Promise<void>;
  clearLocalData: () => void;
}

export function getLinkedAuthProviders(
  providerData: ReadonlyArray<{ providerId?: string | null }> | null | undefined
): AuthProviderKind[] {
  if (!providerData || providerData.length === 0) return [];
  const found: AuthProviderKind[] = [];
  for (const info of providerData) {
    if (info.providerId === 'password' && !found.includes('password')) {
      found.push('password');
    } else if (info.providerId === 'google.com' && !found.includes('google.com')) {
      found.push('google.com');
    }
  }
  return found;
}

export function resolveReauthProvider(
  linkedProviders: AuthProviderKind[],
  options?: DeleteAccountOptions
): AuthProviderKind {
  if (options?.preferredProvider && linkedProviders.includes(options.preferredProvider)) {
    return options.preferredProvider;
  }
  if (options?.password && linkedProviders.includes('password')) {
    return 'password';
  }
  if (linkedProviders.includes('google.com') && !linkedProviders.includes('password')) {
    return 'google.com';
  }
  if (linkedProviders.includes('password')) {
    return 'password';
  }
  if (linkedProviders.includes('google.com')) {
    return 'google.com';
  }
  throw new AccountDeletionError(
    'Unable to determine how to verify your account identity. Please log out, log back in, and try again.',
    'reauth',
    false
  );
}

/**
 * Executes account deletion strictly in safe order:
 * 1. Re-authenticate BEFORE reading/modifying/deleting any Firestore data.
 * 2. Delete all user subcollections in bounded paginated batches (idempotent on retry).
 * 3. Delete user profile document.
 * 4. Delete Firebase Auth user ONLY after all Firestore deletions succeed.
 * 5. Clear local storage preferences.
 */
export async function executeAccountDeletionWorkflow(
  adapter: AccountDeletionAdapter,
  options: DeleteAccountOptions = {}
): Promise<AccountDeletionSummary> {
  const provider = resolveReauthProvider(adapter.linkedProviders, options);

  if (provider === 'password' && (!options.password || options.password.length === 0)) {
    throw new AccountDeletionError(
      'Please enter your current password to confirm account deletion.',
      'reauth',
      true
    );
  }

  // Step 1: Mandatory re-authentication BEFORE touching any Firestore documents
  try {
    await adapter.reauthenticate(provider, options.password);
  } catch (err) {
    if (err instanceof AccountDeletionError) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : 'Identity verification failed. No data was deleted.';
    throw new AccountDeletionError(msg, 'reauth', true);
  }

  // Step 2: Bounded paginated batch deletion of all subcollections (resumable & idempotent)
  const batchSize = Math.min(Math.max(options.batchSize ?? 250, 1), 450);
  const deletedSubcollectionDocs: Record<UserSubcollectionName, number> = {
    subjects: 0,
    tasks: 0,
    focusSessions: 0,
    goals: 0,
  };

  for (const subcollection of USER_SUBCOLLECTIONS) {
    let iterationSafety = 0;
    while (iterationSafety < 1000) {
      iterationSafety += 1;
      let ids: string[];
      try {
        ids = await adapter.fetchSubcollectionBatchIds(subcollection, batchSize);
      } catch {
        throw new AccountDeletionError(
          `Could not finish removing your ${subcollection} data. Your account is still active — please retry deletion.`,
          'firestore',
          true
        );
      }

      if (ids.length === 0) {
        break;
      }

      try {
        await adapter.deleteSubcollectionBatch(subcollection, ids);
        deletedSubcollectionDocs[subcollection] += ids.length;
      } catch {
        throw new AccountDeletionError(
          `Deletion paused while removing your ${subcollection} data. Your login remains active so you can safely retry.`,
          'firestore',
          true
        );
      }
    }
  }

  // Step 3: Delete main user document
  try {
    await adapter.deleteUserProfileDoc();
  } catch {
    throw new AccountDeletionError(
      'Could not remove your profile document. Your login remains active so you can safely retry deletion.',
      'firestore',
      true
    );
  }

  // Step 4: Only AFTER all Firestore deletions succeed, delete Firebase Auth account
  try {
    await adapter.deleteAuthUser();
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : 'Workspace data was deleted, but final account removal failed. Please verify your login and retry.';
    throw new AccountDeletionError(msg, 'auth', true);
  }

  // Step 5: Clear local browser preferences
  adapter.clearLocalData();

  return {
    deletedSubcollectionDocs,
    profileDeleted: true,
    authDeleted: true,
  };
}
