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
	{
		path: "/payment",
		route: userRoutes,
	},
];

defaultRoutes.forEach((route) => {
	routes.use(route.path, route.route);
});

export default routes;
