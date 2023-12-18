import { Response } from "express";
import { dbQuery } from "../../db";
import { UserRole } from "../../models";
import { ApiError, ErrorCodes } from "../../utils";

export const getUserSaved = async ({ user_id }: { user_id: string }) => {
	console.log("test");
	const user_saved = await dbQuery(
		`
	SELECT
		uss.id,
		uss.service_id,
		uss.user_id,
		uss.service_type,
		combined_query.*
	FROM
		USER_SAVED_SERVICE uss
	LEFT JOIN (
		SELECT
			'media_partner' AS service_type,
			mp.*,
			AVG(mpr.rating) AS average_rating,
			COALESCE(MIN(mpp.price), 0) AS min_price
		FROM
			MEDIA_PARTNER mp
		LEFT JOIN
			MEDIA_PARTNER_REVIEW mpr ON mp.id = mpr.mp_id
		LEFT JOIN
			MEDIA_PARTNER_PACKAGE mpp ON mp.id = mpp.mp_id
		GROUP BY
			mp.id
	
		UNION ALL
	
		SELECT
			'sponsorship' AS service_type,
			sp.*,
			AVG(spr.rating) AS average_rating,
			0 AS min_price
		FROM
			SPONSORSHIP sp
		LEFT JOIN
			SPONSORSHIP_REVIEW spr ON sp.id = spr.sp_id
		GROUP BY
			sp.id
	) combined_query ON uss.service_id = combined_query.id AND uss.service_type = combined_query.service_type
	WHERE
		uss.user_id = $1;
	`,
		[user_id]
	);

	return user_saved;
};

export const saveService = async ({
	user_id,
	service_id,
	service_type,
}: {
	user_id: string;
	service_id: string;
	service_type: string;
}) => {
	await dbQuery(
		"INSERT INTO USER_SAVED_SERVICE (service_id, user_id, service_type) values ($1, $2, $3)",
		[service_id, user_id, service_type]
	);

	return null;
};

export const unsaveService = async ({
	res,
	saved_id,
}: {
	res: Response;
	saved_id: string;
}) => {
	const user_id = await dbQuery(
		`SELECT user_id FROM USER_SAVED_SERVICE WHERE id = $1`,
		[saved_id]
	);

	if (
		user_id.rows[0]?.user_id === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(`DELETE FROM USER_SAVED_SERVICE WHERE id = $1`, [
			saved_id,
		]);
		return null;
	}
	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};
