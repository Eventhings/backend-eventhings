import express from "express";

const exampleRoute = express.Router();

exampleRoute.get("/", (_, res) => {
	res.send({
		data: "Hello!",
	}).status(200);
});

export default exampleRoute;
