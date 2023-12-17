import express from "express";
import allServiceRoute from "./all.route";
import mediaPartnerRoute from "./mediaPartner.route";
import sponsorshipRoute from "./sponsorship.route";

const eventRoutes = express.Router();

const defaultRoutes = [
	{
		path: "all",
		route: allServiceRoute,
	},
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
