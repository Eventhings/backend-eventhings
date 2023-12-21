import express, { Request, Response } from "express";
import { recommendCB, recommendCF } from "../../controllers";
import { isAuthenticated } from "../../middlewares";
import { ServiceType } from "../../models";
import { ApiError, ErrorCodes, eventhingsResponse } from "../../utils";

const recommendRoute = express.Router();

recommendRoute.get(
	"/cf",
	isAuthenticated,
	eventhingsResponse(async (_req: Request, res: Response) => {
		try {
			const { uid } = res.locals;
			const recommendation = await recommendCF({ user_id: uid });
			return {
				status: 200,
				data: recommendation ?? [],
				message: `Get all recommendation for ${uid} successfully`,
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

recommendRoute.get(
	"/cb/:category/:serviceId",
	isAuthenticated,
	eventhingsResponse(async (req: Request) => {
		try {
			const { category, serviceId } = req.params;
			const recommendation = await recommendCB({
				category: category as ServiceType,
				service_id: serviceId,
			});

			return {
				status: 200,
				data: recommendation ?? [],
				message: `Get recommendation for ${category} for service ${serviceId} successfully`,
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

export default recommendRoute;
