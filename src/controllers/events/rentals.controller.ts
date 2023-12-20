import { Response } from "express";
import { dbQuery } from "../../db";
import {
	EventsData,
	EventsFilter,
	RentalsPackages,
	UpdateCreateRentalsBody,
	UserRole,
} from "../../models";
import { uploadFile } from "../../service";
import { ApiError, ErrorCodes } from "../../utils";

export const getAllRentals = async ({
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
			rtl.*,
			AVG(r.rating) AS average_rating,
			COALESCE(MIN(p.price), 0) AS min_price
		FROM
			RENTALS rtl
		LEFT JOIN
			RENTALS_REVIEW r ON rtl.id = r.rt_id
		LEFT JOIN
			RENTALS_PACKAGE p ON rtl.id = r.rt_id
		WHERE 1 = 1
	`;
	const queryParams = [];

	Object.keys(filter)
		.filter((val) => val !== "fees")
		.map((val) => {
			if (filter[val as keyof EventsFilter]) {
				if (val == "name") {
					query += ` AND ${val} ILIKE '%' || $${
						queryParams.length + 1
					} || '%'`;
				} else {
					query += ` AND ${val} = $${queryParams.length + 1}`;
				}

				queryParams.push(filter[val as keyof EventsFilter]);
			}
		});

	query += ` GROUP BY rtl.id`;

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
		`SELECT COUNT(*) FROM (${query}) as rentals`, 
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

export const getRentalsById = async ({ id }: { id: string }) => {
	const rentals = await dbQuery(
		`SELECT * FROM rentals WHERE id = $1`,
		[id]
	);

	const rentals_package = await dbQuery(
		`SELECT * FROM rentals_package WHERE rt_id = $1 ORDER BY name`,
		[id]
	);

	const rentals_review = await dbQuery(
		`SELECT * FROM rentals_review WHERE rt_id = $1`,
		[id]
	);

	return {
		...rentals.rows[0],
		packages: [...rentals_package.rows],
		reviews: [...rentals_review.rows],
	};
};

export const createRentals = async ({
	data,
	created_by,
}: {
	data: UpdateCreateRentalsBody;
	created_by: string;
}) => {
	const logo_url = await uploadFile({
		fileName: `${new Date().getTime().toString(36)}.jpg`,
		base64: data.logo,
		folderName: "event-image",
		isPublic: true,
	});

	const rentals_results = await dbQuery(
		`INSERT INTO RENTALS (name, field, created_by, logo_url, description, value, email, line, twitter, whatsapp, instagram, website) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
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

	const rt_id = rentals_results.rows[0]?.id;

	for (const val of data.packages || []) {
		await dbQuery(
			`INSERT INTO RENTALS_PACKAGE (rt_id, name, description, price)
			VALUES ($1, $2, $3, $4)`,
			[rt_id, val.name, val.description, val.price]
		);
	}

	const { logo, ...output } = data;

	return { id: rt_id, data: { logo_url: logo_url, ...output } };
};

export const deleteRentals = async ({ id }: { id: string }) => {
	await dbQuery(`DELETE FROM RENTALS WHERE id = $1`, [id]);
	return null;
};

export const updateRentals = async ({
	rt_id,
	data,
	res,
}: {
	rt_id: string;
	data: UpdateCreateRentalsBody;
	res: Response;
}) => {
	const creator_id = await dbQuery(
		`SELECT created_by FROM RENTALS WHERE id = $1`,
		[rt_id]
	);

	if (
		creator_id.rows[0]?.created_by === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(
			`
			UPDATE RENTALS
			SET name = $1, field = $2, last_updated = $3, description = $4, value = $5
			WHERE id = $6;
		`,
			[
				data.name,
				data.field,
				new Date(),
				data.description,
				data.value,
				rt_id,
			]
		);

		return data;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};

export const approveRentals = async ({
	rt_id,
	is_approved,
}: {
	rt_id: string;
	is_approved: boolean;
}) => {
	await dbQuery(
		`UPDATE RENTALS
		SET is_approved = $1
		WHERE id = $2`,
		[is_approved, rt_id]
	);

	return null;
};

export const activateRentals = async ({
	rt_id,
	is_active,
	res,
}: {
	rt_id: string;
	is_active: boolean;
	res: Response;
}) => {
	const creator_id = await dbQuery(
		`SELECT created_by FROM RENTALS WHERE id = $1`,
		[rt_id]
	);

	if (
		creator_id.rows[0]?.created_by === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(
			`UPDATE RENTALS
			SET is_active = $1
			WHERE id = $2`,
			[is_active, rt_id]
		);

		return null;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};

export const archiveRentals = async ({
	rt_id,
	is_archived,
	res,
}: {
	rt_id: string;
	is_archived: boolean;
	res: Response;
}) => {
	const creator_id = await dbQuery(
		`SELECT created_by FROM RENTALS WHERE id = $1`,
		[rt_id]
	);

	if (
		creator_id.rows[0]?.created_by === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(
			`UPDATE RENTALS
			SET is_archived = $1
			WHERE id = $2`,
			[is_archived, rt_id]
		);

		return null;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};

export const addRentalsPackage = async ({
	rt_id,
	data,
}: {
	rt_id: string;
	data: RentalsPackages[];
}) => {
	for (const val of data) {
		await dbQuery(
			`INSERT INTO RENTALS_PACKAGE (rt_id, name, description, price)
			VALUES ($1, $2, $3, $4)`,
			[rt_id, val.name, val.description, val.price]
		);
	}
	
	return data;
};

export const updateRentalsPackage = async ({
	package_id,
	rt_id,
	data,
	res,
}: {
	package_id: string;
	rt_id: string;
	data: RentalsPackages;
	res: Response;
}) => {
	const creator_id = await dbQuery(
		`SELECT created_by FROM RENTALS WHERE id = $1`,
		[rt_id]
	);

	if (
		creator_id.rows[0]?.created_by === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(
			`UPDATE RENTALS_PACKAGE
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

export const deleteRentalsPackage = async ({
	package_id,
	rt_id,
	res,
}: {
	package_id: string;
	rt_id: string;
	res: Response;
}) => {
	const creator_id = await dbQuery(
		`SELECT created_by FROM RENTALS WHERE id = $1`,
		[rt_id]
	);

	if (
		creator_id.rows[0]?.created_by === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(`DELETE FROM RENTALS_PACKAGE WHERE id = $1`, [
			package_id,
		]);
		return null;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};

export const availabilityRentalsPackage = async ({
	rt_id,
	availability,
	res,
}: {
	rt_id: string;
	availability: boolean;
	res: Response;
}) => {
	const creator_id = await dbQuery(
		`SELECT created_by FROM RENTALS WHERE id = $1`,
		[rt_id]
	);

	if (
		creator_id.rows[0]?.created_by === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(
			`UPDATE RENTALS_PACKAGE
			SET availability = $1
			WHERE id = $2`,
			[availability, rt_id]
		);

		return null;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
}

export const addRentalsReview = async ({
	rt_id,
	reviewer_id,
	review,
	rating,
}: {
	rt_id: string;
	reviewer_id: string;
	review: string;
	rating: number;
}) => {
	const rt_review = await dbQuery(
		`INSERT INTO RENTALS_REVIEW (rt_id, reviewer_id, review, rating) VALUES ($1, $2, $3, $4)`,
		[rt_id, reviewer_id, review, rating]
	);

	return rt_review.rows[0];
};

export const updateRentalsReview = async ({
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
		`SELECT reviewer_id FROM RENTALS_REVIEW WHERE id = $1`,
		[review_id]
	);

	if (reviewer_id.rows[0]?.reviewer_id === res.locals.uid) {
		await dbQuery(
			`UPDATE RENTALS_REVIEW
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

export const deleteRentalsReview = async ({
	review_id,
	res,
}: {
	review_id: string;
	res: Response;
}) => {
	const reviewer_id = await dbQuery(
		`SELECT reviewer_id FROM RENTALS_REVIEW WHERE id = $1`,
		[review_id]
	);

	if (
		reviewer_id.rows[0]?.reviewer_id === res.locals.uid ||
		res.locals.role === UserRole.ADMIN
	) {
		await dbQuery(`DELETE FROM RENTALS_REVIEW WHERE id = $1`, [
			review_id
		]);
		return null;
	}

	throw new ApiError({
		code: ErrorCodes.unauthorizedErrorCode,
		details: "Unauthorized",
	});
};
