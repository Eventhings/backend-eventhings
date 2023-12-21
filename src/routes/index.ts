import express from "express";
import { ApiError, ErrorCodes, eventhingsResponse } from "../utils";
import chatRoutes from "./chat";
import eventRoutes from "./event";
import mlRoutes from "./ml";
import purchaseRoute from "./purchase";
import savedRoute from "./saved";
import userRoutes from "./user.route";

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
	{
		path: "/chat",
		route: chatRoutes,
	},
	{
		path: "/purchase",
		route: purchaseRoute,
	},
	{
		path: "/saved",
		route: savedRoute,
	},
	{
		path: "/ml",
		route: mlRoutes,
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
