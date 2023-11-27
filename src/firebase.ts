import * as admin from "firebase-admin";
import { initializeApp } from "firebase/app";
import { env } from "process";

export const firebaseConfig = {
	apiKey: env.FIREBASE_API_KEY,
	authDomain: env.FIREBASE_AUTH_DOMAIN,
	projectId: env.FIREBASE_PROJECT_ID,
	storageBucket: env.FIREBASE_PROJECT_BUCKET,
	messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
	appId: env.FIREBASE_APP_ID,
	measurementId: env.FIREBASE_MEASUREMENT_ID,
};

export const initFirebase = () => {
	initializeApp(firebaseConfig);
	admin.initializeApp(firebaseConfig);
};
