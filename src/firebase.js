// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAPi79eI8GfOJsnkWHjFUeTI9J3xtJhulY",
  authDomain: "officecalendar-c881d.firebaseapp.com",
  projectId: "officecalendar-c881d",
  storageBucket: "officecalendar-c881d.appspot.com",
  messagingSenderId: "243677223222",
  appId: "1:243677223222:web:6502ba2ac2d6f80b2ffb97"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);