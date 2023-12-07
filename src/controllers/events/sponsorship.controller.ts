import { Response } from "express";
import { dbQuery } from "../../db";
import { uploadFile } from "../../gcloud";
import {
	EventsData,
	EventsFilter,
	SocialMedia,
	UpdateCreateSponsorshipBody,
	UserRole,
} from "../../models";
import { ApiError, ErrorCodes } from "../../utils";

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
	let query = `SELECT * FROM sponsorship WHERE 1 = 1`;
	Object.keys(filter).map((val) => {
		if (filter[val as keyof EventsFilter]) {
			if (val == "name") {
				query += ` AND ${val} ILIKE '%${
					filter[val as keyof EventsFilter]
				}%'`;
			} else {
				query += ` AND ${val} = '${filter[val as keyof EventsFilter]}'`;
			}
		}
	});

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

	const res = await dbQuery(`${query} LIMIT ${limit} OFFSET ${page * limit}`);
	const total = await dbQuery("SELECT COUNT(*) FROM sponsorship");
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
		`SELECT * FROM sponsorship WHERE id = '${id}'`
	);

	const sponsorship_social_media = await dbQuery(
		`SELECT * FROM sponsorship_social_media WHERE sp_id = '${id}' ORDER BY social_media`
	);

	return {
		...sponsorship.rows[0],
		social_media: [...sponsorship_social_media.rows],
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
		`INSERT INTO SPONSORSHIP (name, field, created_by, logo_url, description, value) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;`,
		[
			data.name,
			data.field,
			created_by,
			logo_url,
			data.description,
			data.value,
		]
	);

	const sp_id = sponsorship_results.rows[0]?.id;

	for (const val of data.social_media || []) {
		await dbQuery(
			`INSERT INTO SPONSORSHIP_SOCIAL_MEDIA (sp_id, social_media, link)
			VALUES ($1, $2, $3)`,
			[sp_id, val.social_media, val.link]
		);
	}

	const { logo, ...output } = data;

	return { id: sp_id, data: { logo_url: logo_url, ...output } };
};

export const deleteSponsorship = async ({ id }: { id: string }) => {
	await dbQuery(`DELETE FROM SPONSORSHIP WHERE id = '${id}'`);
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

export const addSponsorshipSocial = async ({
	sp_id,
	data,
}: {
	sp_id: string;
	data: SocialMedia[];
}) => {
	for (const val of data || []) {
		await dbQuery(
			`INSERT INTO SPONSORSHIP_SOCIAL_MEDIA (sp_id, social_media, link)
			VALUES ($1, $2, $3)`,
			[sp_id, val.social_media, val.link]
		);
	}

	return data;
};

export const updateSponsorshipSocial = async ({
	social_id,
	sp_id,
	data,
	res,
}: {
	social_id: string;
	sp_id: string;
	data: SocialMedia;
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
			`UPDATE SPONSORSHIP_SOCIAL_MEDIA
			SET social_media = $1, link = $2
			WHERE id = $3`,
			[data.social_media, data.link, social_id]
		);
		return null;
	}
	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};

export const deleteSponsorshipSocial = async ({
	social_id,
	sp_id,
	res,
}: {
	social_id: string;
	sp_id: string;
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
			`DELETE FROM SPONSORSHIP_SOCIAL_MEDIA WHERE id = '${social_id}'`
		);
		return null;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};
