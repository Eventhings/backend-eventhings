import express from "express";
import eventRoutes from "./event";

const routes = express.Router();

const defaultRoutes = [
	{
		path: "/event",
		route: eventRoutes,
	},
];

defaultRoutes.forEach((route) => {
	routes.use(route.path, route.route);
});

export default routes;
