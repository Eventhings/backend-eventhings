import express, { Request, Response } from "express";
import {
	createUserPurchase,
	getAllServicePurchase,
	getAllUserPurchase,
	updatePurchaseStatus,
} from "../../controllers";
import { isAuthenticated } from "../../middlewares";
import { PurchaseStatus } from "../../models";
import { ApiError, ErrorCodes, eventhingsResponse } from "../../utils";

const purchaseRoute = express.Router();

purchaseRoute.get(
	"/user/:userId",
	isAuthenticated,
	eventhingsResponse(async (req: Request) => {
		try {
			const params = req.params;
			const res = await getAllUserPurchase({ userId: params.userId });

			return {
				status: 200,
				data: res.rows ?? [],
				message: `Get all user ${params.userId} purchases successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "",
			});

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			throw apiError;
		}
	})
);

purchaseRoute.get(
	"/service/:serviceId",
	isAuthenticated,
	eventhingsResponse(async (req: Request) => {
		try {
			const params = req.params;
			const res = await getAllServicePurchase({
				serviceId: params.serviceId,
			});

			return {
				status: 200,
				data: res.rows ?? [],
				message: `Get all service ${params.serviceId} purchases successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "",
			});

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			throw apiError;
		}
	})
);
purchaseRoute.post(
	"/",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const body = await req.body;
			const userPurchase = await createUserPurchase({
				data: {
					...body,
					user_id: res.locals.uid,
					status: PurchaseStatus.PENDING,
					email: res.locals.email,
				},
			});
			return {
				status: 200,
				data: {
					...userPurchase,
				},
				message: "Created user purchases successfully",
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "",
			});

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			throw apiError;
		}
	})
);

purchaseRoute.post(
	"/notification",
	eventhingsResponse(async (req: Request) => {
		try {
			const body = await req.body;
			console.log(body);
			const extractOrderId = (inputString: string) => {
				const lastIndex = inputString.lastIndexOf("-");

				const extractedValue = inputString.substring(0, lastIndex);

				return extractedValue;
			};

			console.log(
				extractOrderId(body.body.order_id),
				body.channel_response_message
			);

			const userPurchase = await updatePurchaseStatus({
				order_id: extractOrderId(body.order_id),
				status: body.channel_response_message,
			});
			return {
				status: 200,
				data: {
					...userPurchase,
				},
				message: `Updated with order id ${extractOrderId(
					body.order_id
				)} status sucessfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "",
			});

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			throw apiError;
		}
	})
);

export default purchaseRoute;
