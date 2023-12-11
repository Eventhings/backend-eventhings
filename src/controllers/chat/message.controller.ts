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
			details: "Please make sure all body needed is available",
		});
	}

	const room = await dbQuery(`SELECT * FROM CHAT_ROOM WHERE id = $1`, [
		room_id,
	]);

	if (
		room.rows[0].business_id === user_id ||
		room.rows[0].customer_id === user_id
	) {
		const messages = await dbQuery(
			`SELECT * FROM CHAT_MESSAGE WHERE room_id = $1`,
			[room_id]
		);

		return {
			business_id: room.rows[0].business_id,
			customer_id: room.rows[0].customer_id,
			messages: messages.rows,
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
