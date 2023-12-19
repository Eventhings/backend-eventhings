import express, { Request, Response } from "express";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import {
	getAllUser,
	getUserMe,
	loginUser,
	refreshUserToken,
	registerUser,
	updateUser,
	updateUserProfileImage,
} from "../controllers";
import { isAuthenticated, isAuthorized } from "../middlewares";
import { UpdateUserSchema, UserRole, UserSchema } from "../models";
import { ApiError, ErrorCodes, eventhingsResponse } from "../utils";

const userRoutes = express.Router();

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
			UserSchema.parse({
				email,
				password,
			});

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

			if (err instanceof ZodError) {
				apiError = new ApiError({
					code: ErrorCodes.badRequestErrorCode,
					message: fromZodError(err).message,
				});
			}

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			throw apiError;
		}
	})
);

userRoutes.post(
	"/register-admin",
	eventhingsResponse(async (req: Request) => {
		try {
			const { email, password } = req.body;

			UserSchema.parse({
				email,
				password,
			});

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

			if (err instanceof ZodError) {
				apiError = new ApiError({
					code: ErrorCodes.badRequestErrorCode,
					message: fromZodError(err).message,
				});
			}

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			throw apiError;
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
				data: { access_token: new_token },
				message: `refreshed token successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
			});

			if (err instanceof ZodError) {
				apiError = new ApiError({
					code: ErrorCodes.badRequestErrorCode,
					message: fromZodError(err).message,
				});
			}

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			return apiError;
		}
	})
);

userRoutes.patch(
	"/me/profile-img",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const body = req.body;
			const { uid } = res.locals;

			const image_url = await updateUserProfileImage({
				profile_img: body.profile_img,
				uid,
			});

			return {
				status: 200,
				data: {
					image_url,
				},
				message: `Updated user ${uid} successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
			});

			if (err instanceof ZodError) {
				apiError = new ApiError({
					code: ErrorCodes.badRequestErrorCode,
					message: fromZodError(err).message,
				});
			}

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			return apiError;
		}
	})
);

userRoutes.patch(
	"/me",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const body = req.body;
			const { uid, role } = res.locals;
			UpdateUserSchema.parse(body);
			const user_data = await updateUser({
				data: body,
				uid,
				role,
			});
			return {
				status: 200,
				data: { ...user_data },
				message: `Updated user ${uid} successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
			});

			if (err instanceof ZodError) {
				apiError = new ApiError({
					code: ErrorCodes.badRequestErrorCode,
					message: fromZodError(err).message,
				});
			}

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			return apiError;
		}
	})
);

export default userRoutes;
