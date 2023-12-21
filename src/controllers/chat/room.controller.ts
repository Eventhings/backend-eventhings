import * as admin from "firebase-admin";
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
		const business_owner_id = await dbQuery(
			`
				select created_by from 
				(SELECT
					'media_partner' AS service_type,
					mp.id,
					mp.created_by
				FROM
					MEDIA_PARTNER mp
				union all 
				SELECT
					'sponsorship' AS service_type,
					sp.id,
					sp.created_by
				FROM
					SPONSORSHIP sp
				union all 
				SELECT
					'rentals' AS service_type,
					rt.id,
					rt.created_by
				FROM
					RENTALS rt) where id = $1
			`,
			[business_id]
		);

		await dbQuery(
			`INSERT INTO CHAT_ROOM (customer_id, business_id, business_owner_id) VALUES ($1, $2, $3)`,
			[customer_id, business_id, business_owner_id.rows[0].created_by]
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
		data = await dbQuery(
			`SELECT * FROM CHAT_ROOM WHERE business_owner_id = $1`,
			[id]
		);
	} else if (role === UserRole.STANDARD) {
		data = await dbQuery(`SELECT * FROM CHAT_ROOM WHERE customer_id = $1`, [
			id,
		]);
	}

	const customer_id_list = data.rows.map((val: any) => {
		return {
			uid: val.customer_id,
		};
	});
	const business_id_list = data.rows.map((val: any) => val.business_id);
	const customer_list = (await admin.auth().getUsers(customer_id_list)).users;
	let query = `
		select * from 
			(SELECT
				'media_partner' AS service_type,
				mp.id,
				mp.name,
				mp.email,
				mp.created_by,
				mp.logo_url,
				mp.description
			FROM
				MEDIA_PARTNER mp
			union all 
			SELECT
				'sponsorship' AS service_type,
				sp.id,
				sp.name,
				sp.email,
				sp.created_by,
				sp.logo_url,
				sp.description
			FROM
				SPONSORSHIP sp
			union all 
			SELECT
				'rentals' AS service_type,
				rt.id,
				rt.name,
				rt.email,
				rt.created_by,
				rt.logo_url,
				rt.description
			FROM
			RENTALS rt)  
	`;

	business_id_list.map((_val: string, index: number) => {
		query +=
			index === 0 ? `WHERE id = $${index + 1}` : ` OR id = $${index + 1}`;
	});
	const business_list = await dbQuery(query, [...business_id_list]);
	const rooms_id_list = data.rows.map((val: any) => val.id);

	let last_message_list: any;
	if (data.rows.length > 0) {
		let lm_query = `
		SELECT *
		FROM (
			SELECT
				*,
				ROW_NUMBER() OVER (PARTITION BY room_id ORDER BY created_at DESC) AS rn
			FROM
				CHAT_MESSAGE
			WHERE
				room_id IN (${rooms_id_list.map((str: string) => `'${str}'`).join(", ")}) 
		) AS ranked_messages
		WHERE rn = 1;
		`;
		last_message_list = await dbQuery(lm_query);
	}

	return {
		rooms: [
			...data.rows.map((val: any) => {
				const customer_detail = customer_list.find(
					(cus) => cus.uid === val.customer_id
				);
				const business_detail = business_list.rows.find(
					(bus: any) => bus.id === val.business_id
				);
				const last_message = last_message_list.rows.find(
					(mes: any) => mes.room_id == val.id
				);

				return {
					id: val.id,
					created_at: val.created_at,
					last_message: {
						message: last_message?.message ?? null,
						created_at: last_message?.created_at ?? null,
					},
					customer: {
						id: val.customer_id,
						name: customer_detail?.displayName ?? null,
						email: customer_detail?.email ?? null,
						photo_url: customer_detail?.photoURL ?? null,
					},
					business: {
						id: val.business_id,
						created_by: business_detail?.created_by ?? null,
						description: business_detail?.description ?? null,
						name: business_detail?.name ?? null,
						email: business_detail?.email ?? null,
						photo_url: business_detail?.logo_url ?? null,
					},
				};
			}),
		],
		total: data.rows.length,
	};
};
