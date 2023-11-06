import express from "express";

const sponsorshipRoute = express.Router();

sponsorshipRoute.get("/", (_, res) => {
	res.send({
		data: "Hello!",
	}).status(200);
});

export default sponsorshipRoute;
