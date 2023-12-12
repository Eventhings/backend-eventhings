import express from "express";
import { messageRoutes } from "./message.route";
import { roomRoutes } from "./room.route";

const chatRoutes = express.Router();

const defaultRoutes = [
	{
		path: "/room",
		route: roomRoutes,
	},
	{
		path: "/message",
		route: messageRoutes,
	},
];

defaultRoutes.forEach((route) => {
	chatRoutes.use(route.path, route.route);
});

export default chatRoutes;
