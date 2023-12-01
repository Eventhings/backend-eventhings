import {
	createUserWithEmailAndPassword,
	getAuth,
	signInWithEmailAndPassword,
} from "firebase/auth";

import axios from "axios";
import * as admin from "firebase-admin";
import { env } from "process";
import { UserRole } from "../models";

export const registerUser = async ({
	email,
	password,
	role,
}: {
	email: string;
	password: string;
	role?: UserRole;
}) => {
	try {
		const auth = getAuth();
		const { user } = await createUserWithEmailAndPassword(
			auth,
			email,
			password
		);

		await admin.auth().setCustomUserClaims(user.uid ?? "", {
			role: role ? role : UserRole.STANDARD,
		});

		return user;
	} catch (err) {
		throw err;
	}
};

export const loginUser = async ({
	email,
	password,
}: {
	email: string;
	password: string;
}) => {
	try {
		const auth = getAuth();
		const creds = await signInWithEmailAndPassword(auth, email, password);

		const access_token = (await creds.user.getIdTokenResult(true)).token;

		return {
			name: creds.user.displayName,
			email: creds.user.email,
			access_token,
			refresh_token: creds.user.refreshToken,
		};
	} catch (err) {
		throw err;
	}
};

export const refreshUserToken = async ({
	refresh_token,
}: {
	refresh_token: string;
}) => {
	try {
		const new_token = await axios.post(
			`https://securetoken.googleapis.com/v1/token?key=${env.FIREBASE_API_KEY}`,
			{
				grant_type: "refresh_token",
				refresh_token: refresh_token,
			}
		);

		return new_token.data.access_token;
	} catch (err) {
		throw err;
	}
};

export const getUserMe = async ({ uid }: { uid: string }) => {
	try {
		const user_data = await admin.auth().getUser(uid);
		return {
			id: user_data.uid ?? null,
			email: user_data.email ?? null,
			display_name: user_data.displayName ?? null,
			photo_url: user_data.photoURL ?? null,
			phone_number: user_data.phoneNumber ?? null,
			created_at: new Date(user_data.metadata.creationTime) ?? null,
			last_sign_in: new Date(user_data.metadata.lastSignInTime) ?? null,
			role: user_data.customClaims?.role ?? null,
		};
	} catch (err) {
		throw err;
	}
};

export const getAllUser = async ({ total }: { total: number }) => {
	try {
		const user_list = await admin.auth().listUsers(total ?? 100);

		return user_list;
	} catch (err) {
		return err;
	}
};
