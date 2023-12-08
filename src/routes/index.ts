import express from "express";
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

routes.get("/", () => {
	return {
		status: 200,
		data: null,
		message: "Eventhings APIs",
	};
});

export default routes;
