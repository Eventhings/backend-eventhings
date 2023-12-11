import express, { Request, Response } from "express";
import { getAllChatRoomMessages, sendMessage } from "../../controllers";
import { isAuthenticated } from "../../middlewares";
import { ApiError, ErrorCodes, eventhingsResponse } from "../../utils";

export const messageRoutes = express.Router();

messageRoutes.get(
	"/:room_id",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const { uid } = res.locals;
			const room_id = req.params.room_id;
			const data = await getAllChatRoomMessages({
				room_id,
				user_id: uid,
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

messageRoutes.post(
	"/send",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const { uid } = res.locals;
			const { room_id, message } = req.body;

			const data = await sendMessage({
				sender_id: uid,
				room_id,
				message,
			});
			return {
				status: 200,
				data: data.rows[0],
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
