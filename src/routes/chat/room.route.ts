import express, { Request, Response } from "express";
import {
	createChatRoom,
	getAllChatRoomById,
} from "../../controllers/chat.controller";
import { isAuthenticated } from "../../middlewares";
import { UserRole } from "../../models";
import { ApiError, ErrorCodes, eventhingsResponse } from "../../utils";

export const roomRoutes = express.Router();

roomRoutes.get(
	"/customer",
	isAuthenticated,
	eventhingsResponse(async (_req: Request, res: Response) => {
		try {
			const { uid } = res.locals;
			if (!uid) {
				throw new ApiError({
					code: ErrorCodes.badRequestErrorCode,
				});
			}
			const data = await getAllChatRoomById({
				id: uid,
				role: UserRole.STANDARD,
			});

			return {
				status: 200,
				data,
				message: `Get all chat room for user ${uid} successfuly`,
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

roomRoutes.get(
	"/business",
	isAuthenticated,
	eventhingsResponse(async (_req: Request, res: Response) => {
		try {
			const { uid } = res.locals;
			if (!uid) {
				throw new ApiError({
					code: ErrorCodes.badRequestErrorCode,
				});
			}
			const data = await getAllChatRoomById({
				id: uid,
				role: UserRole.BUSINESS,
			});

			return {
				status: 200,
				data,
				message: `Get all chat room for user ${uid} successfuly`,
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

roomRoutes.post(
	"/",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const { uid } = res.locals;
			const { business_id } = req.body;
			if (!uid && !business_id) {
				throw new ApiError({
					code: ErrorCodes.badRequestErrorCode,
				});
			}
			await createChatRoom({
				customer_id: uid,
				business_id: business_id,
			});

			return {
				status: 200,
				data: null,
				message: `Created chat room for user ${uid} and business ${business_id} succesfully`,
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
