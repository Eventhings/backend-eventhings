import { dbQuery } from "../../db";
import { UserRole } from "../../models";
import { ApiError, ErrorCodes } from "../../utils";

export const createChatRoom = async ({
	customer_id,
	business_id,
}: {
	customer_id: string;
	business_id: string;
}) => {
	const { rowCount } = await dbQuery(
		`SELECT 1
            FROM CHAT_ROOM
        WHERE customer_id = $1
            AND business_id = $2`,
		[customer_id, business_id]
	);

	if (rowCount === 0) {
		await dbQuery(
			`INSERT INTO CHAT_ROOM (customer_id, business_id) VALUES ($1, $2)`,
			[customer_id, business_id]
		);
		return;
	}

	throw new ApiError({
		code: ErrorCodes.validationErrorCode,
		details: "Duplicate room",
	});
};

export const getAllChatRoomById = async ({
	id,
	role,
}: {
	id: string;
	role: UserRole;
}) => {
	let data;
	if (role === UserRole.BUSINESS) {
		data = await dbQuery(`SELECT * FROM CHAT_ROOM WHERE business_id = $1`, [
			id,
		]);
	} else if (role === UserRole.STANDARD) {
		data = await dbQuery(`SELECT * FROM CHAT_ROOM WHERE customer_id = $1`, [
			id,
		]);
	}

	return { rooms: [...data.rows], total: data.rows.length };
};
