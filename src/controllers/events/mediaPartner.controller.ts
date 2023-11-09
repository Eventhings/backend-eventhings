import { dbQuery } from "../../db";
import {
	CreateMediaPartnerBody,
	GetAllMediaPartnerData,
} from "../../models/events";

export const getAllMediaPartner = async ({
	limit,
	page,
}: {
	limit: number;
	page: number;
}) => {
	try {
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
	} catch (err) {
		throw err;
	}
};

export const createMediaPartner = async ({
	data,
}: {
	data: CreateMediaPartnerBody;
}) => {
	try {
		await dbQuery(
			"INSERT INTO MEDIA_PARTNER(name, field) VALUES ($1, $2)",
			[data.name, data.field]
		);
		return data;
	} catch (err) {
		throw err;
	}
};
