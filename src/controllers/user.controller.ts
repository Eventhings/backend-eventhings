import {
	createUserWithEmailAndPassword,
	getAuth,
	signInWithEmailAndPassword,
} from "firebase/auth";

export const registerUser = async ({
	email,
	password,
}: {
	email: string;
	password: string;
}) => {
	try {
		const auth = getAuth();
		const { providerId } = await createUserWithEmailAndPassword(
			auth,
			email,
			password
		);

		return providerId;
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
		};
	} catch (err) {
		throw err;
	}
};
