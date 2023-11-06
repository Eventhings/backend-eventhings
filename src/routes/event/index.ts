import express from "express";
import mediaPartnerRoute from "./mediaPartner.route";

const eventRoutes = express.Router();

const defaultRoutes = [
	{
		path: "/media-partner",
		route: mediaPartnerRoute,
	},
];

defaultRoutes.forEach((route) => {
	eventRoutes.use(route.path, route.route);
});

export default eventRoutes;
