import { Server as HTTPServer } from "http";
import { Server } from "socket.io";

let messages: any[] = [];

export const socketConnection = (server: HTTPServer) => {
	const io = new Server(server, {
		cors: {
			origin: "*",
			methods: ["POST", "GET"],
		},
	});

	io.on("connection", (socket: any) => {
		console.log(`User Connected : ${socket.id}`);

		socket.on("send_message", (data: any) => {
			messages = [...messages, { message: data, id: socket.id }];
			socket.emit("receive_message", messages);
			socket.broadcast.emit("receive_message", messages);
		});

		socket.on("receive_message", () => {
			socket.emit("receive_message", messages);
		});
	});
};
