import express, { Request, Response } from "express";
import {
	getAllUser,
	getUserMe,
	loginUser,
	refreshUserToken,
	registerUser,
} from "../controllers";
import { isAuthenticated, isAuthorized } from "../middlewares";
import { UserRole } from "../models";
import { ApiError, ErrorCodes, eventhingsResponse } from "../utils";

export const userRoutes = express.Router();

userRoutes.get(
	"/me",
	isAuthenticated,
	eventhingsResponse(async (_req: Request, res: Response) => {
		try {
			const { uid } = res.locals;

			if (!uid) {
				throw new ApiError({
					code: ErrorCodes.badRequestErrorCode,
				});
			}
			const user_data = await getUserMe({ uid });
			return {
				status: 200,
				data: { ...user_data },
				message: `Get user ${uid} succesfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
			});

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			return apiError;
		}
	})
);

userRoutes.get(
	"/all",
	isAuthenticated,
	isAuthorized({ allowedRoles: [UserRole.ADMIN] }),
	eventhingsResponse(async (req: Request, _res: Response) => {
		try {
			const { total } = req.params;
			const userList = await getAllUser({
				total: total as unknown as number,
			});

			return {
				status: 200,
				data: { users: userList },
				message: `Get all user succesfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
			});

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			return apiError;
		}
	})
);

userRoutes.post(
	"/register",
	eventhingsResponse(async (req: Request) => {
		try {
			const { email, password } = req.body;

			if (!password || !email) {
				throw new ApiError({
					code: ErrorCodes.forbiddenErrorCode,
					details: "Please fill out all needed field",
				});
			}
			await registerUser({ email, password });

			return {
				status: 200,
				data: { email: email },
				message: `registered ${email} successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
			});

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			return apiError;
		}
	})
);

userRoutes.post(
	"/login",
	eventhingsResponse(async (req: Request) => {
		try {
			const { email, password } = req.body;

			if (!password || !email) {
				throw new ApiError({
					code: ErrorCodes.forbiddenErrorCode,
					details: "Please fill out all needed field",
				});
			}
			const creds = await loginUser({ email, password });

			return {
				status: 200,
				data: { ...creds },
				message: `user ${email} logged in successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
			});

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			return apiError;
		}
	})
);

userRoutes.post(
	"/register-admin",
	eventhingsResponse(async (req: Request) => {
		try {
			const { email, password } = req.body;

			if (!password || !email) {
				throw new ApiError({
					code: ErrorCodes.forbiddenErrorCode,
					details: "Please fill out all needed field",
				});
			}
			await registerUser({ email, password, role: UserRole.ADMIN });

			return {
				status: 200,
				data: { email: email },
				message: `registered ${email} successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
			});

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			return apiError;
		}
	})
);

userRoutes.post(
	"/refresh-token",
	eventhingsResponse(async (req: Request) => {
		try {
			const { refresh_token } = req.body;
			if (!refresh_token) {
				throw new ApiError({
					code: ErrorCodes.forbiddenErrorCode,
					details: "No refresh token found",
				});
			}
			const new_token = await refreshUserToken({ refresh_token });

			return {
				status: 200,
				data: { refresh_token: new_token },
				message: `refreshed token successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
			});

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			return apiError;
		}
	})
);

userRoutes.get(
	"/eventhings",
	eventhingsResponse(async () => {
		try {
			return {
				status: 200,
				data: null,
				message: "Eventhings APIs",
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
			});

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			return apiError;
		}
	})
);
