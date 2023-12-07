import express from "express";
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

export default eventRoutes;
