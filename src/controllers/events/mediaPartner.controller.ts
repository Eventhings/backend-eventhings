import { dbQuery } from "../../db";
import {
	GetAllMediaPartnerData,
	UpdateCreateMediaPartnerBody,
} from "../../models";

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
		`SELECT * FROM media_partner_package WHERE mp_id = '${id}'`
	);

	const media_partner_social_media = await dbQuery(
		`SELECT * FROM media_partner_social_media WHERE mp_id = '${id}'`
	);

	return {
		...media_partner.rows[0],
		...media_partner_detail.rows[0],
		packages: [...media_partner_package.rows],
		social_media: [...media_partner_social_media.rows],
	};
};

export const createMediaPartner = async ({
	data,
	created_by,
}: {
	data: UpdateCreateMediaPartnerBody;
	created_by: string;
}) => {
	const media_partner_results = await dbQuery(
		`INSERT INTO MEDIA_PARTNER (name, field, created_by) VALUES ($1, $2, $3) RETURNING id;`,
		[data.name, data.field, created_by]
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
			[mp_id, val.name, val.link]
		);
	}

	return { id: mp_id, data: data };
};

export const deleteMediaPartner = async ({ id }: { id: string }) => {
	await dbQuery(`DELETE FROM MEDIA_PARTNER WHERE id = '${id}'`);
	return null;
};

export const updateMediaPartner = async ({
	id,
	data,
}: {
	id: string;
	data: UpdateCreateMediaPartnerBody;
}) => {
	await dbQuery(
		`
		UPDATE MEDIA_PARTNER
		SET name = $1, field = $2, last_updated = $3
		WHERE id = $4;
	`,
		[data.name, data.field, new Date(), id]
	);

	await dbQuery(
		`UPDATE MEDIA_PARTNER_DETAIL
		SET description = $1, value = $2
		WHERE mp_id = $3`,
		[data.description, data.value, id]
	);

	for (const val of data.packages || []) {
		await dbQuery(
			`
			UPDATE MEDIA_PARTNER_PACKAGE
			SET name = $1, description = $2, price = $3
			WHERE mp_id = $4;`,
			[val.name, val.description, val.price, id]
		);
	}

	for (const val of data.social_media || []) {
		await dbQuery(
			`
			UPDATE MEDIA_PARTNER_SOCIAL_MEDIA
			SET social_media = $1, link = $2
			WHERE mp_id = $3;`,
			[val.name, val.link, id]
		);
	}

	return data;
};

export const approveMediaPartner = async ({
	id,
	is_approved,
}: {
	id: string;
	is_approved: boolean;
}) => {
	await dbQuery(
		`UPDATE MEDIA_PARTNER
		SET is_approved = $1
		WHERE id = $2`,
		[is_approved, id]
	);

	return null;
};

export const activateMediaPartner = async ({
	id,
	is_active,
}: {
	id: string;
	is_active: boolean;
}) => {
	await dbQuery(
		`UPDATE MEDIA_PARTNER
		SET is_active = $1
		WHERE id = $2`,
		[is_active, id]
	);

	return null;
};
