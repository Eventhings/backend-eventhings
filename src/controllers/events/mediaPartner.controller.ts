import { Response } from "express";
import * as admin from "firebase-admin";
import { dbQuery } from "../../db";
import {
	EventsData,
	EventsFilter,
	MediaPartnerPackages,
	UpdateCreateMediaPartnerBody,
	UserRole,
} from "../../models";
import { uploadFile } from "../../service";
import { ApiError, ErrorCodes, partiallyObscureEmail } from "../../utils";

export const getAllMediaPartner = async ({
	limit,
	page,
	filter,
	sort_by,
	sort_method,
}: {
	limit: number;
	page: number;
	filter: Partial<EventsFilter>;
	sort_by: string;
	sort_method: string;
}) => {
	let query = `
		SELECT
			m.*,
			AVG(r.rating) AS average_rating,
			COALESCE(MIN(p.price), 0) AS min_price
		FROM
			MEDIA_PARTNER m
		LEFT JOIN
			MEDIA_PARTNER_REVIEW r ON m.id = r.mp_id
		LEFT JOIN
			MEDIA_PARTNER_PACKAGE p ON m.id = r.mp_id
		WHERE 1 = 1
	`;
	const queryParams = [];
	Object.keys(filter)
		.filter((val) => val !== "fees")
		.map((val) => {
			if (filter[val as keyof EventsFilter]) {
				if (val === "field") {
					filter["field"]?.map((field, index) => {
						query += ` ${index === 0 ? "AND" : "OR"} m.${val} = $${
							queryParams.length + 1
						}`;
						queryParams.push(field);
					});
				} else {
					if (val == "name") {
						query += ` AND m.${val} ILIKE '%' || $${
							queryParams.length + 1
						} || '%'`;
					} else {
						query += ` AND ${val} = $${queryParams.length + 1}`;
					}

					queryParams.push(filter[val as keyof EventsFilter]);
				}
			}
		});

	query += ` GROUP BY m.id`;

	if (filter["fees"]) {
		query += ` HAVING COALESCE(MIN(p.price), 0) <= $${
			queryParams.length + 1
		}`;
		queryParams.push(filter["fees"] === "free" ? 0 : 9999999999999);
	}

	if (sort_by && sort_method) {
		const allowedSortMethods = ["asc", "desc"];
		if (allowedSortMethods.includes(sort_method.toLowerCase())) {
			query += ` ORDER BY ${sort_by} ${sort_method}`;
		} else {
			throw new ApiError({
				code: ErrorCodes.badRequestErrorCode,
				details: "Wrong sorting method",
			});
		}
	}

	const total = await dbQuery(
		`SELECT COUNT(*) FROM (${query}) as media_partners`,
		queryParams
	);

	query += ` LIMIT $${queryParams.length + 1} OFFSET $${
		queryParams.length + 2
	}`;

	queryParams.push(limit, page * limit);
	const res = await dbQuery(query, queryParams);
	const total_page = Math.ceil(total.rows[0].count / limit);
	return {
		total: parseInt(total.rows[0].count ?? 0),
		limit,
		page,
		total_page,
		data: res.rows ?? ([] as EventsData[]),
	};
};

export const getMediaPartnerById = async ({ id }: { id: string }) => {
	const media_partner = await dbQuery(
		`SELECT * FROM media_partner WHERE id = $1`,
		[id]
	);

	const media_partner_package = await dbQuery(
		`SELECT * FROM media_partner_package WHERE mp_id = $1 ORDER BY name`,
		[id]
	);

	const media_partner_review = await dbQuery(
		`SELECT * FROM media_partner_review WHERE mp_id = $1`,
		[id]
	);

	const user_id_list = media_partner_review.rows.map((val: any) => {
		return {
			uid: val.user_id,
		};
	});
	const user_list = (await admin.auth().getUsers(user_id_list)).users;

	return {
		...media_partner.rows[0],
		packages: [...media_partner_package.rows],
		reviews: [
			...media_partner_review.rows.map((review: any) => {
				const user_detail = user_list.find(
					(val) => val.uid === review.user_id
				);
				return {
					...review,
					user_detail: {
						id: review.user_id,
						name: user_detail?.displayName ?? null,
						email:
							partiallyObscureEmail(
								user_detail?.email as string
							) ?? null,
					},
				};
			}),
		],
	};
};

export const createMediaPartner = async ({
	data,
	created_by,
}: {
	data: UpdateCreateMediaPartnerBody;
	created_by: string;
}) => {
	const logo_url = await uploadFile({
		fileName: `${new Date().getTime().toString(36)}.jpg`,
		base64: data.logo,
		folderName: "media-partner-image",
		isPublic: true,
	});

	const media_partner_results = await dbQuery(
		`INSERT INTO MEDIA_PARTNER (name, field, created_by, logo_url, description, value, email, line, twitter, whatsapp, instagram, website) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id;`,
		[
			data.name,
			data.field,
			created_by,
			logo_url,
			data.description,
			data.value,
			data.email,
			data.line,
			data.twitter,
			data.whatsapp,
			data.instagram,
			data.website,
		]
	);

	const mp_id = media_partner_results.rows[0]?.id;

	for (const val of data.packages || []) {
		await dbQuery(
			`INSERT INTO MEDIA_PARTNER_PACKAGE (mp_id, name, description, price)
			VALUES ($1, $2, $3, $4)`,
			[mp_id, val.name, val.description, val.price]
		);
	}

	const { logo, ...output } = data;

	return { id: mp_id, data: { logo_url: logo_url, ...output } };
};

export const deleteMediaPartner = async ({ id }: { id: string }) => {
	await dbQuery(`DELETE FROM MEDIA_PARTNER WHERE id = $1`, [id]);
	return null;
};

export const updateMediaPartner = async ({
	mp_id,
	data,
	res,
}: {
	mp_id: string;
	data: UpdateCreateMediaPartnerBody;
	res: Response;
}) => {
	const creator_id = await dbQuery(
		`SELECT created_by FROM MEDIA_PARTNER WHERE id = $1`,
		[mp_id]
	);

	if (
		creator_id.rows[0]?.created_by === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(
			`
			UPDATE MEDIA_PARTNER
			SET name = $1, field = $2, last_updated = $3, description = $4, value = $5
			WHERE id = $6;
		`,
			[
				data.name,
				data.field,
				new Date(),
				data.description,
				data.value,
				mp_id,
			]
		);

		return data;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};

export const approveMediaPartner = async ({
	mp_id,
	is_approved,
}: {
	mp_id: string;
	is_approved: boolean;
}) => {
	await dbQuery(
		`UPDATE MEDIA_PARTNER
		SET is_approved = $1
		WHERE id = $2`,
		[is_approved, mp_id]
	);

	return null;
};

export const activateMediaPartner = async ({
	mp_id,
	is_active,
	res,
}: {
	mp_id: string;
	is_active: boolean;
	res: Response;
}) => {
	const creator_id = await dbQuery(
		`SELECT created_by FROM MEDIA_PARTNER WHERE id = $1`,
		[mp_id]
	);

	if (
		creator_id.rows[0]?.created_by === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(
			`UPDATE MEDIA_PARTNER
			SET is_active = $1
			WHERE id = $2`,
			[is_active, mp_id]
		);

		return null;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};

export const archiveMediaPartner = async ({
	mp_id,
	is_archived,
	res,
}: {
	mp_id: string;
	is_archived: boolean;
	res: Response;
}) => {
	const creator_id = await dbQuery(
		`SELECT created_by FROM MEDIA_PARTNER WHERE id = $1`,
		[mp_id]
	);

	if (
		creator_id.rows[0]?.created_by === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(
			`UPDATE MEDIA_PARTNER
			SET is_archived = $1
			WHERE id = $2`,
			[is_archived, mp_id]
		);

		return null;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};

export const addMediaPartnerPackage = async ({
	mp_id,
	data,
}: {
	mp_id: string;
	data: MediaPartnerPackages[];
}) => {
	for (const val of data || []) {
		await dbQuery(
			`INSERT INTO MEDIA_PARTNER_PACKAGE (mp_id, name, description, price)
			VALUES ($1, $2, $3, $4)`,
			[mp_id, val.name, val.description, val.price]
		);
	}

	return data;
};

export const updateMediaPartnerPackage = async ({
	package_id,
	mp_id,
	data,
	res,
}: {
	package_id: string;
	mp_id: string;
	data: MediaPartnerPackages;
	res: Response;
}) => {
	const creator_id = await dbQuery(
		`SELECT created_by FROM MEDIA_PARTNER WHERE id = $1`,
		[mp_id]
	);

	if (
		creator_id.rows[0]?.created_by === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(
			`UPDATE MEDIA_PARTNER_PACKAGE
			SET description = $1, name = $2, price = $3
			WHERE id = $4`,
			[data.description, data.name, data.price, package_id]
		);
		return null;
	}
	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};

export const deleteMediaPartnerPackage = async ({
	package_id,
	mp_id,
	res,
}: {
	package_id: string;
	mp_id: string;
	res: Response;
}) => {
	const creator_id = await dbQuery(
		`SELECT created_by FROM MEDIA_PARTNER WHERE id = $1`,
		[mp_id]
	);

	if (
		creator_id.rows[0]?.created_by === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(`DELETE FROM MEDIA_PARTNER_PACKAGE WHERE id = $1`, [
			package_id,
		]);
		return null;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};

export const addMediaPartnerReview = async ({
	mp_id,
	reviewer_id,
	review,
	rating,
}: {
	mp_id: string;
	reviewer_id: string;
	review: string;
	rating: number;
}) => {
	const mp_review = await dbQuery(
		`INSERT INTO MEDIA_PARTNER_REVIEW (mp_id, user_id, review, rating) VALUES ($1, $2, $3, $4);`,
		[mp_id, reviewer_id, review, rating]
	);

	return mp_review.rows[0];
};

export const updateMediaPartnerReview = async ({
	review_id,
	review,
	rating,
	res,
}: {
	review_id: string;
	review: string;
	rating: number;
	res: Response;
}) => {
	const reviewer_id = await dbQuery(
		`SELECT user_id FROM MEDIA_PARTNER_REVIEW WHERE id = $1`,
		[review_id]
	);

	if (reviewer_id.rows[0]?.created_by === res.locals.uid) {
		await dbQuery(
			`UPDATE MEDIA_PARTNER_REVIEW
			SET review = $1, rating = $2
			WHERE id = $3`,
			[review, rating, review_id]
		);

		return null;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};

export const deleteMediaPartnerReview = async ({
	review_id,
	res,
}: {
	review_id: string;
	res: Response;
}) => {
	const reviewer_id = await dbQuery(
		`SELECT user_id FROM MEDIA_PARTNER_REVIEW WHERE id = $1`,
		[review_id]
	);

	if (
		reviewer_id.rows[0]?.created_by === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(`DELETE FROM MEDIA_PARTNER_REVIEW WHERE id = $1`, [
			review_id,
		]);
		return null;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};
