import express, { Request } from "express";
import { loginUser, registerUser } from "../controllers";
import { ApiError, ErrorCodes, eventhingsResponse } from "../utils";

export const userRoutes = express.Router();

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
