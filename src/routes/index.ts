import express from "express";
import { ApiError, ErrorCodes, eventhingsResponse } from "../utils";
import eventRoutes from "./event";
import { userRoutes } from "./user.route";

const routes = express.Router();

const defaultRoutes = [
	{
		path: "/event",
		route: eventRoutes,
	},
	{
		path: "/user",
		route: userRoutes,
	},
];

defaultRoutes.forEach((route) => {
	routes.use(route.path, route.route);
});

routes.get(
	"/eventhings",
	eventhingsResponse(async () => {
		try {
			return {
				status: 200,
				data: null,
				message: "Testing Eventhings APIs",
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

export default routes;
