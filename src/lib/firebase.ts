import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Deeply sanitizes an object before writing to Firestore.
 * Strips all `undefined` fields recursively so Firestore setDoc/updateDoc never errors.
 */
export function sanitizeFirestorePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeFirestorePayload(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        cleaned[key] = sanitizeFirestorePayload(val);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Extracts a safe, human-readable user message from any Firestore error.
 * Never leaks raw authentication payloads, tokens, passwords, or internal JSON dumps.
 */
export function getSafeFirestoreErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  
  let rawMsg = error instanceof Error ? error.message : String(error);
  
  // If the message is wrapped in a stringified JSON payload, unwrap it
  try {
    if (rawMsg.startsWith('{') && rawMsg.includes('"error"')) {
      const parsed = JSON.parse(rawMsg);
      rawMsg = parsed.error || rawMsg;
    }
  } catch {}

  const lower = (rawMsg + ' ' + (typeof (error as any)?.code === 'string' ? (error as any).code : '')).toLowerCase();

  if (lower.includes('permission-denied') || lower.includes('insufficient permissions')) {
    return "You don't have permission to edit or save this content.";
  }
  if (lower.includes('unsupported field value: undefined')) {
    return 'Invalid form data: blank or undefined values are not permitted.';
  }
  if (lower.includes('not-found')) {
    return 'The requested document was not found.';
  }
  if (lower.includes('unavailable') || lower.includes('offline') || lower.includes('network')) {
    return 'Network connection issue. Please check your internet connection.';
  }
  if (lower.includes('already-exists')) {
    return 'An item with this ID already exists.';
  }
  return 'Unable to save changes. Please try again.';
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const rawMsg = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code || 'unknown';

  // Log clean diagnostic details during development without passwords or sensitive credentials
  console.error(`[Firestore ${operationType.toUpperCase()}] Error at ${path}:`, {
    code,
    message: rawMsg,
    path,
    userId: auth.currentUser?.uid || 'anonymous'
  });

  const safeMessage = getSafeFirestoreErrorMessage(error);
  const safeErr = new Error(safeMessage);
  (safeErr as any).code = code;
  (safeErr as any).originalMessage = rawMsg;
  throw safeErr;
}

// Initial connection test
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client offline or unreachable.');
      return false;
    }
    // Return true since failure on non-existent test doc is expected unless network error
    return true;
  }
}

// Run connection check non-blocking
testConnection().catch(console.error);
