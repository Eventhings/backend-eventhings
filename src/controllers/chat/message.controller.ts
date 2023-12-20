import * as admin from "firebase-admin";
import { dbQuery } from "../../db";
import { ApiError, ErrorCodes } from "../../utils";

export const getAllChatRoomMessages = async ({
	room_id,
	user_id,
}: {
	room_id: string;
	user_id: string;
}) => {
	if (!room_id && !user_id) {
		throw new ApiError({
			code: ErrorCodes.badRequestErrorCode,
			details: "Please params needed is available",
		});
	}

	const room = await dbQuery(`SELECT * FROM CHAT_ROOM WHERE id = $1`, [
		room_id,
	]);

	if (
		room.rows[0].business_id === user_id ||
		room.rows[0].customer_id === user_id
	) {
		const user_list = (
			await admin
				.auth()
				.getUsers([
					{ uid: room.rows[0].business_id },
					{ uid: room.rows[0].customer_id },
				])
		).users;

		const messages = await dbQuery(
			`SELECT id, created_at, user_id, message FROM CHAT_MESSAGE WHERE room_id = $1`,
			[room_id]
		);

		return {
			business_detail: {
				id: room.rows[0].business_id,
				email: user_list[0].email,
				username: user_list[0].displayName ?? null,
			},
			customer_detail: {
				id: room.rows[0].customer_id,
				email: user_list[1].email,
				username: user_list[1].displayName ?? null,
			},
			messages: [
				...messages.rows.map((message: any) => {
					const user = user_list.find(
						(user) => message.user_id === user.uid
					);
					return {
						...message,
						username: user?.displayName,
						email: user?.email,
					};
				}),
			],
		};
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};

export const sendMessage = async ({
	room_id,
	sender_id,
	message,
}: {
	room_id: string;
	sender_id: string;
	message: string;
}) => {
	if (!room_id && !sender_id) {
		throw new ApiError({
			code: ErrorCodes.badRequestErrorCode,
			details: "Please make sure all body needed is available",
		});
	}

	const message_data = await dbQuery(
		`INSERT INTO CHAT_MESSAGE (room_id, user_id, message) VALUES ($1, $2, $3) RETURNING *;`,
		[room_id, sender_id, message]
	);

	return message_data;
};
