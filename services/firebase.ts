// Firebase client initialization for Expo/React Native
// 1) Go to Firebase Console -> Project Settings -> Your apps -> SDK setup and configuration
// 2) Replace the config object below with your project's values

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAv39z3Gl7GKX_qbLq0z6WgGi9XAZB7EL4',
  authDomain: 'fixit-65795.firebaseapp.com',
  projectId: 'fixit-65795',
  storageBucket: 'fixit-65795.firebasestorage.app',
  messagingSenderId: '756409690224',
  appId: '1:756409690224:web:77aaf2254b00459b59ecb5',
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

export const auth = getAuth(app);
export const db = getFirestore(app);
