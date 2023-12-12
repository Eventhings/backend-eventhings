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
		socket.on("send_message", (data: any) => {
			messages = [...messages, { message: data, id: socket.id }];
			if (data.room) {
				socket.to(data.room).emit("receive_message", messages);
			} else {
				socket.broadcast.emit("receive_message", messages);
			}
			socket.emit("receive_message", messages);
		});

		socket.on("receive_message", () => {
			if (socket.room) {
				socket.to(socket.room).emit("receive_message", messages);
			} else {
				socket.broadcast.emit("receive_message", messages);
			}
		});

		socket.on("join_room", (room_id: string) => {
			console.log(`joined ${room_id}`);
			socket.join(room_id);
		});
	});
};
