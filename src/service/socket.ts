import { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import { sendMessage } from "../controllers";

export const socketConnection = (server: HTTPServer) => {
	const io = new Server(server, {
		cors: {
			origin: "*",
			methods: ["POST", "GET"],
		},
	});

	io.on("connection", (socket: any) => {
		console.log(`User Conected :${socket.id}`);

		socket.on("connect_error", (err: any) => {
			console.log(`connect_error due to ${err.message}`);
		});

		socket.on(
			"send_message",
			({
				room_id,
				data,
			}: {
				room_id: string;
				data: {
					id: string;
					created_at: string;
					user_id: string;
					message: string;
				};
			}) => {
				if (room_id) {
					try {
						sendMessage({
							message: data.message,
							room_id,
							sender_id: data.user_id,
						});
						socket.to(room_id).emit("receive_message", data);
					} catch (err) {
						throw err;
					}
				} else {
					socket.broadcast.emit("receive_message", data);
				}
				socket.emit("receive_message", data);
			}
		);

		socket.on("receive_message", () => {
			console.log(socket.rooms[1]);
			if (socket.room) {
				socket.to(socket.room).emit("receive_message", []);
			} else {
				socket.broadcast.emit("receive_message", []);
			}
		});

		socket.on("join_room", (room_id: string) => {
			console.log(socket.rooms[1]);

			console.log(`left ${Object.keys(socket.rooms)[0]}`);
			socket.leave(socket.room);

			console.log(`joined ${room_id}`);
			socket.join(room_id);
		});
	});
};
