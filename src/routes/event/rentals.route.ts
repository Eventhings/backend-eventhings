import express from "express";

const rentalsRoute = express.Router();

rentalsRoute.get("/", (_, res) => {
	res.send({
		data: "Hello!",
	}).status(200);
});

export default rentalsRoute;
