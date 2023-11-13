import express, { Request } from "express";
import {
	createMediaPartner,
	getAllMediaPartner,
} from "../../controllers/events/mediaPartner.controller";
import { ApiError, ErrorCodes, eventhingsResponse } from "../../utils";

const mediaPartnerRoute = express.Router();

mediaPartnerRoute.get(
	"/",
	eventhingsResponse(async (req: Request) => {
		try {
			const params = await req.query;
			const res = await getAllMediaPartner({
				limit: parseInt((params.limit ?? 10) as string),
				page: parseInt((params.page ?? 0) as string),
			});
			return {
				status: 200,
				data: {
					...res,
				},
				message: "Get all media partner successfully",
			};
		} catch {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "",
			});

			throw apiError;
		}
	})
);

mediaPartnerRoute.post(
	"/",
	eventhingsResponse(async (req: Request) => {
		try {
			const body = await req.body;
			const res = await createMediaPartner({
				data: body as any,
			});

			return {
				status: 200,
				data: {
					...res,
				},
				message: "Created media partner successfully",
			};
		} catch {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "",
			});

			throw apiError;
		}
	})
);

export default mediaPartnerRoute;
