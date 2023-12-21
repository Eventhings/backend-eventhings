import express from "express";
import recommendRoute from "./recommend.route";

const mlRoutes = express.Router();

const defaultRoutes = [
	{
		path: "/recommend",
		route: recommendRoute,
	},
];

defaultRoutes.forEach((route) => {
	mlRoutes.use(route.path, route.route);
});

export default mlRoutes;
