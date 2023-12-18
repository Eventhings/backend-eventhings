import express, { Request, Response } from "express";
import { createUserPurchase, updatePurchaseStatus } from "../../controllers";
import { isAuthenticated } from "../../middlewares";
import { ApiError, ErrorCodes, eventhingsResponse } from "../../utils";

const purchaseRoute = express.Router();

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

			const extractOrderId = (inputString: string) => {
				const lastIndex = inputString.lastIndexOf("-");

				const extractedValue = inputString.substring(0, lastIndex);

				return extractedValue;
			};

			const userPurchase = await updatePurchaseStatus({
				order_id: extractOrderId(body.body.order_id),
				status: body.body.channel_response_message,
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
