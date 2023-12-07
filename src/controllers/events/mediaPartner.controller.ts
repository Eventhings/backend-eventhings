import { Response } from "express";
import { dbQuery } from "../../db";
import { uploadFile } from "../../gcloud";
import {
	GetAllMediaPartnerData,
	MediaPartnerPackages,
	SocialMedia,
	UpdateCreateMediaPartnerBody,
	UserRole,
} from "../../models";
import { ApiError, ErrorCodes } from "../../utils";

//! TODO: ADD FILTER
export const getAllMediaPartner = async ({
	limit,
	page,
}: {
	limit: number;
	page: number;
}) => {
	const res = await dbQuery(
		`SELECT * FROM media_partner LIMIT ${limit} OFFSET ${page * limit}`
	);
	const total = await dbQuery("SELECT COUNT(*) FROM media_partner");
	const total_page = Math.ceil(total.rows[0].count / limit);
	return {
		total: parseInt(total.rows[0].count ?? 0),
		limit,
		page,
		total_page,
		data: res.rows ?? ([] as GetAllMediaPartnerData[]),
	};
};

export const getMediaPartnerById = async ({ id }: { id: string }) => {
	const media_partner = await dbQuery(
		`SELECT * FROM media_partner WHERE id = '${id}'`
	);

	const media_partner_detail = await dbQuery(
		`SELECT * FROM media_partner_detail WHERE mp_id = '${id}'`
	);

	const media_partner_package = await dbQuery(
		`SELECT * FROM media_partner_package WHERE mp_id = '${id}' ORDER BY name`
	);

	const media_partner_social_media = await dbQuery(
		`SELECT * FROM media_partner_social_media WHERE mp_id = '${id}' ORDER BY social_media`
	);

	return {
		...media_partner.rows[0],
		...media_partner_detail.rows[0],
		packages: [...media_partner_package.rows],
		social_media: [...media_partner_social_media.rows],
	};
};

export const getMediaPartnerByCreator = async ({
	creator_id,
	limit,
	page,
}: {
	creator_id: string;
	limit: number;
	page: number;
}) => {
	const res = await dbQuery(
		`SELECT * FROM media_partner WHERE created_by = '${creator_id}' LIMIT ${limit} OFFSET ${
			page * limit
		}`
	);
	const total = await dbQuery(
		`SELECT COUNT(*) FROM media_partner WHERE created_by = '${creator_id}'`
	);
	console.log(res);
	const total_page = Math.ceil(total.rows[0].count / limit);
	return {
		total: parseInt(total.rows[0].count ?? 0),
		limit,
		page,
		total_page,
		data: res.rows ?? ([] as GetAllMediaPartnerData[]),
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
		folderName: "user-profile",
		isPublic: true,
	});

	const media_partner_results = await dbQuery(
		`INSERT INTO MEDIA_PARTNER (name, field, created_by, logo_url) VALUES ($1, $2, $3, $4) RETURNING id;`,
		[data.name, data.field, created_by, logo_url]
	);

	const mp_id = media_partner_results.rows[0]?.id;

	await dbQuery(
		`INSERT INTO MEDIA_PARTNER_DETAIL (mp_id, description, value)
		VALUES ($1, $2, $3)`,
		[mp_id, data.description, data.value]
	);

	for (const val of data.packages || []) {
		await dbQuery(
			`INSERT INTO MEDIA_PARTNER_PACKAGE (mp_id, name, description, price)
			VALUES ($1, $2, $3, $4)`,
			[mp_id, val.name, val.description, val.price]
		);
	}

	for (const val of data.social_media || []) {
		await dbQuery(
			`INSERT INTO MEDIA_PARTNER_SOCIAL_MEDIA (mp_id, social_media, link)
			VALUES ($1, $2, $3)`,
			[mp_id, val.social_media, val.link]
		);
	}

	const { logo, ...output } = data;

	return { id: mp_id, data: { logo_url: logo_url, ...output } };
};

export const deleteMediaPartner = async ({ id }: { id: string }) => {
	await dbQuery(`DELETE FROM MEDIA_PARTNER WHERE id = '${id}'`);
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
			SET name = $1, field = $2, last_updated = $3
			WHERE id = $4;
		`,
			[data.name, data.field, new Date(), mp_id]
		);

		await dbQuery(
			`UPDATE MEDIA_PARTNER_DETAIL
			SET description = $1, value = $2
			WHERE mp_id = $3`,
			[data.description, data.value, mp_id]
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
		await dbQuery(
			`DELETE FROM MEDIA_PARTNER_PACKAGE WHERE id = '${package_id}'`
		);
		return null;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};

export const addMediaPartnerSocial = async ({
	mp_id,
	data,
}: {
	mp_id: string;
	data: SocialMedia[];
}) => {
	for (const val of data || []) {
		await dbQuery(
			`INSERT INTO MEDIA_PARTNER_SOCIAL_MEDIA (mp_id, social_media, link)
			VALUES ($1, $2, $3)`,
			[mp_id, val.social_media, val.link]
		);
	}

	return data;
};

export const updateMediaPartnerSocial = async ({
	social_id,
	mp_id,
	data,
	res,
}: {
	social_id: string;
	mp_id: string;
	data: SocialMedia;
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
			`UPDATE MEDIA_PARTNER_SOCIAL_MEDIA
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

export const deleteMediaPartnerSocial = async ({
	social_id,
	mp_id,
	res,
}: {
	social_id: string;
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
		await dbQuery(
			`DELETE FROM MEDIA_PARTNER_SOCIAL_MEDIA WHERE id = '${social_id}'`
		);
		return null;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};
