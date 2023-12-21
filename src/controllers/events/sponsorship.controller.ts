import axios from "axios";
import { Response } from "express";
import * as admin from "firebase-admin";
import { dbQuery } from "../../db";
import {
	EventsData,
	EventsFilter,
	UpdateCreateSponsorshipBody,
	UserRole,
} from "../../models";
import { uploadFile } from "../../service";
import {
	ApiError,
	ErrorCodes,
	ML_API_URL,
	partiallyObscureEmail,
} from "../../utils";

export const getAllSponsorship = async ({
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
			s.*,
			AVG(r.rating) AS average_rating
		FROM
			sponsorship s
		LEFT JOIN
			sponsorship_review r ON s.id = r.sp_id
		WHERE 1 = 1
	`;
	const queryParams: any[] = [];

	Object.keys(filter).map((val) => {
		if (filter[val as keyof EventsFilter]) {
			if (val === "field") {
				filter["field"]?.map((field, index) => {
					query += ` ${index === 0 ? "AND" : "OR"} s.${val} = $${
						queryParams.length + 1
					}`;
					queryParams.push(field);
				});
			} else {
				if (val == "name") {
					query += ` AND ${val} ILIKE '%' || $${
						queryParams.length + 1
					} || '%'`;
				} else {
					query += ` AND ${val} = $${queryParams.length + 1}`;
				}
				queryParams.push(filter[val as keyof EventsFilter]);
			}
		}
	});

	query += ` GROUP BY s.id`;

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
		`SELECT COUNT(*) FROM (${query}) as sponsorships`,
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

export const getSponsorshipById = async ({ id }: { id: string }) => {
	const sponsorship = await dbQuery(
		`SELECT
			s.*,
			AVG(r.rating) AS average_rating
		FROM
			sponsorship s
		LEFT JOIN
			sponsorship_review r ON s.id = r.sp_id
		WHERE s.id = $1
		GROUP BY s.id`,
		[id]
	);

	const sponsorship_review = await dbQuery(
		`SELECT * FROM sponsorship_review WHERE sp_id = $1`,
		[id]
	);

	const user_id_list = sponsorship_review.rows.map((val: any) => {
		return {
			uid: val.user_id,
		};
	});

	const user_list = (await admin.auth().getUsers(user_id_list)).users;

	const sentiment = await axios.get(
		`${ML_API_URL}/nlpe/collective/sponsorship/${id}`
	);
	const sorted_sentiment = Object.entries(sentiment.data.data.emotion_portion)
		.sort(([, a], [, b]) => (b as number) - (a as number))
		.reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

	return {
		...sponsorship.rows[0],
		review_sentiment: Object.keys(sorted_sentiment)[0] ?? null,
		reviews: [
			...sponsorship_review.rows.map((review: any) => {
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
						profile_img: user_detail?.photoURL ?? null,
					},
				};
			}),
		],
	};
};

export const createSponsorship = async ({
	data,
	created_by,
}: {
	data: UpdateCreateSponsorshipBody;
	created_by: string;
}) => {
	const logo_url = await uploadFile({
		fileName: `${new Date().getTime().toString(36)}.jpg`,
		base64: data.logo,
		folderName: "sponsorship-file",
		isPublic: true,
	});

	const sponsorship_results = await dbQuery(
		`INSERT INTO SPONSORSHIP (name, field, created_by, logo_url, description, value, email, line, twitter, whatsapp, instagram, website) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id;`,
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

	const sp_id = sponsorship_results.rows[0]?.id;

	const { logo, ...output } = data;

	return { id: sp_id, data: { logo_url: logo_url, ...output } };
};

export const deleteSponsorship = async ({ id }: { id: string }) => {
	await dbQuery(`DELETE FROM SPONSORSHIP WHERE id = $1`, [id]);
	return null;
};

export const updateSponsorship = async ({
	sp_id,
	data,
	res,
}: {
	sp_id: string;
	data: UpdateCreateSponsorshipBody;
	res: Response;
}) => {
	const creator_id = await dbQuery(
		`SELECT created_by FROM SPONSORSHIP WHERE id = $1`,
		[sp_id]
	);

	if (
		creator_id.rows[0]?.created_by === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(
			`
			UPDATE SPONSORSHIP
			SET name = $1, field = $2, last_updated = $3, description = $4, value = $5
			WHERE id = $6;
		`,
			[
				data.name,
				data.field,
				new Date(),
				data.description,
				data.value,
				sp_id,
			]
		);

		return data;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};

export const approveSponsorship = async ({
	sp_id,
	is_approved,
}: {
	sp_id: string;
	is_approved: boolean;
}) => {
	await dbQuery(
		`UPDATE SPONSORSHIP
		SET is_approved = $1
		WHERE id = $2`,
		[is_approved, sp_id]
	);

	return null;
};

export const activateSponsorship = async ({
	sp_id,
	is_active,
	res,
}: {
	sp_id: string;
	is_active: boolean;
	res: Response;
}) => {
	const creator_id = await dbQuery(
		`SELECT created_by FROM SPONSORSHIP WHERE id = $1`,
		[sp_id]
	);

	if (
		creator_id.rows[0]?.created_by === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(
			`UPDATE SPONSORSHIP
			SET is_active = $1
			WHERE id = $2`,
			[is_active, sp_id]
		);

		return null;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};

export const archiveSponsorship = async ({
	sp_id,
	is_archived,
	res,
}: {
	sp_id: string;
	is_archived: boolean;
	res: Response;
}) => {
	const creator_id = await dbQuery(
		`SELECT created_by FROM SPONSORSHIP WHERE id = $1`,
		[sp_id]
	);

	if (
		creator_id.rows[0]?.created_by === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(
			`UPDATE SPONSORSHIP
			SET is_archived = $1
			WHERE id = $2`,
			[is_archived, sp_id]
		);

		return null;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};

export const addSponsorshipReview = async ({
	sp_id,
	reviewer_id,
	review,
	rating,
}: {
	sp_id: string;
	reviewer_id: string;
	review: string;
	rating: number;
}) => {
	const sp_review = await dbQuery(
		`INSERT INTO SPONSORSHIP_REVIEW (sp_id, user_id, review, rating) VALUES ($1, $2, $3, $4);`,
		[sp_id, reviewer_id, review, rating]
	);

	return sp_review.rows[0];
};

export const updateSponsorshipReview = async ({
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
		`SELECT user_id FROM SPONSORSHIP_REVIEW WHERE id = $1`,
		[review_id]
	);

	if (reviewer_id.rows[0]?.created_by === res.locals.uid) {
		await dbQuery(
			`UPDATE SPONSORSHIP_REVIEW
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

export const deleteSponsorshipReview = async ({
	review_id,
	res,
}: {
	review_id: string;
	res: Response;
}) => {
	const reviewer_id = await dbQuery(
		`SELECT user_id FROM SPONSORSHIP_REVIEW WHERE id = $1`,
		[review_id]
	);

	if (
		reviewer_id.rows[0]?.created_by === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(`DELETE FROM SPONSORSHIP_REVIEW WHERE id = $1`, [
			review_id,
		]);
		return null;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};
