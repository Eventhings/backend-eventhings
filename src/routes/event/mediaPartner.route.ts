import express from "express";

const mediaPartnerRoute = express.Router();

mediaPartnerRoute.get("/", (_, res) => {
	res.send({
		data: "Hello!",
	}).status(200);
});

export default mediaPartnerRoute;
