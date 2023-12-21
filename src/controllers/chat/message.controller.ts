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

	if (room.rows.length === 0) {
		throw new ApiError({
			code: ErrorCodes.badRequestErrorCode,
			message: `There are no room with id ${room_id}`,
		});
	}

	if (
		room.rows[0].business_owner_id === user_id ||
		room.rows[0].customer_id === user_id
	) {
		const user_data = await admin.auth().getUser(room.rows[0].customer_id);

		const business_data = await dbQuery(
			`
			select * from 
			(SELECT
				'media_partner' AS service_type,
				mp.name,
				mp.email,
				mp.created_by,
				mp.logo_url
			FROM
				MEDIA_PARTNER mp
			union all 
			SELECT
				'sponsorship' AS service_type,
				sp.name,
				sp.email,
				sp.created_by,
				sp.logo_url
			FROM
				SPONSORSHIP sp
			union all 
			SELECT
				'rentals' AS service_type,
				rt.name,
				rt.email,
				rt.created_by,
				rt.logo_url
			FROM
				RENTALS rt) 
			where created_by = $1
			`,
			[room.rows[0].business_owner_id]
		);
		const messages = await dbQuery(
			`SELECT id, created_at, user_id, message FROM CHAT_MESSAGE WHERE room_id = $1`,
			[room_id]
		);

		return {
			messages: [
				...messages.rows.map((message: any) => {
					const sender_data =
						message.user_id === room.rows[0].business_owner_id
							? {
									username:
										business_data.rows[0]?.name ?? null,
									email: business_data.rows[0]?.email ?? null,
									profile_img:
										business_data.rows[0]?.logo_url ?? null,
							  }
							: {
									username: user_data?.displayName ?? null,
									email: user_data?.email ?? null,
									profile_img: user_data.photoURL ?? null,
							  };
					return {
						...message,
						sender: sender_data,
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
