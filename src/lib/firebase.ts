import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { buildSanitizedFirestoreErrorInfo, SanitizedFirestoreErrorInfo } from '../utils/errorUtils';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with firestoreDatabaseId (Critical)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Operation type for Firestore error tracking
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type FirestoreErrorInfo = SanitizedFirestoreErrorInfo;

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo = buildSanitizedFirestoreErrorInfo(error, operationType, path, auth.currentUser);
  if (import.meta.env.DEV) {
    console.error('Firestore Error:', errInfo);
  } else {
    console.error('Firestore operation failed:', {
      operationType: errInfo.operationType,
      errorCode: errInfo.errorCode ?? 'unknown',
    });
  }
  throw new Error(JSON.stringify(errInfo));
}

// Connection check as required by Firebase skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection check: client is currently offline or connecting.');
    }
  }
}

// Run test connection
testConnection();
