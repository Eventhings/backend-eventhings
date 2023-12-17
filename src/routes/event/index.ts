import express, { Request } from "express";
import { getAllEventService } from "../../controllers";
import { ApiError, ErrorCodes, eventhingsResponse } from "../../utils";
import mediaPartnerRoute from "./mediaPartner.route";
import sponsorshipRoute from "./sponsorship.route";

const eventRoutes = express.Router();

const defaultRoutes = [
	{
		path: "/media-partner",
		route: mediaPartnerRoute,
	},
	{
		path: "/sponsorship",
		route: sponsorshipRoute,
	},
];

defaultRoutes.forEach((route) => {
	eventRoutes.use(route.path, route.route);
});

eventRoutes.get(
	"/",
	eventhingsResponse(async (req: Request) => {
		try {
			const params = await req.query;
			const res = await getAllEventService({
				limit: parseInt((params.limit ?? 10) as string),
				page: parseInt((params.page ?? 0) as string),
				filter: {
					name: (params.name as string) ?? undefined,
					field: (params.field as string) ?? undefined,
					is_active: (params.is_active as string) ?? undefined,
					is_approved: (params.is_approved as string) ?? undefined,
					is_archived: (params.is_archived as string) ?? undefined,
					fees: (params.fees as "paid" | "free") ?? undefined,
				},
				sort_by: (params.sort_by as string) ?? undefined,
				sort_method: (params.sort_method as string) ?? undefined,
			});
			return {
				status: 200,
				data: {
					...res,
				},
				message: "Get all event services successfully",
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

export default eventRoutes;
