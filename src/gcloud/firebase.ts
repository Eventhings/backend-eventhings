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

export const firebaseAdminCreds = {
	type: "service_account",
	project_id: env.FIREBASE_PROJECT_ID,
	private_key_id: env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
	private_key: env.FIREBASE_ADMIN_PRIVATE_KEY,
	client_email: env.FIREBASE_ADMIN_CLIENT_EMAIL,
	client_id: env.FIREBASE_ADMIN_CLIENT_ID,
	auth_url: "https://accounts.google.com/o/oauth2/auth",
	token_uri: "https://oauth2.googleapis.com/token",
	auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
	client_x509_cert_url:
		"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-z96r6%40practice-capstone.iam.gserviceaccount.com",
	universe_domain: "googleapis.com",
};

export const initFirebase = () => {
	initializeApp(firebaseConfig);
	admin.initializeApp({
		...firebaseConfig,
		credential: admin.credential.cert(
			firebaseAdminCreds as admin.ServiceAccount
		),
	});
};
