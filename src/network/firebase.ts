import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth, type User } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let db: Database | null = null;
let auth: Auth | null = null;

function isConfigured(): boolean {
  return !!firebaseConfig.apiKey && !!firebaseConfig.databaseURL;
}

function getApp(): FirebaseApp {
  if (!app) {
    if (!isConfigured()) throw new Error('Firebase not configured. Set VITE_FIREBASE_* in .env');
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getDb(): Database {
  if (!db) db = getDatabase(getApp());
  return db;
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getApp());
  return auth;
}

export async function signInAnon(): Promise<User> {
  const a = getFirebaseAuth();
  const cred = await signInAnonymously(a);
  return cred.user;
}

export function getCurrentUserId(): string | null {
  return getFirebaseAuth().currentUser?.uid ?? null;
}

export { isConfigured as isFirebaseConfigured };
