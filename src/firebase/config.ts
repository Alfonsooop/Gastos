import type { FirebaseOptions } from 'firebase/app';

const env = import.meta.env;

/** Configuración de Firebase tomada de las variables VITE_FIREBASE_*, o null si no está. */
export const firebaseConfig: FirebaseOptions | null =
  env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID
    ? {
        apiKey: env.VITE_FIREBASE_API_KEY,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.VITE_FIREBASE_APP_ID,
      }
    : null;
