import express from "express";
import exampleRoute from "./example.route";

const routes = express.Router();

const defaultRoutes = [
	{
		path: "/example",
		route: exampleRoute,
	},
];

defaultRoutes.forEach((route) => {
	routes.use(route.path, route.route);
});

export default routes;
