import { dbQuery } from "../../db";
import { EventsData, EventsFilter } from "../../models";
import { ApiError, ErrorCodes } from "../../utils";

export const getAllEventService = async ({
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
	//! TODO: TAMBAHIN RENTALS
	let query_mp = `
    SELECT
        'media_partner' AS service_type,
        mp.*,
        AVG(mpr.rating) as average_rating,
        COALESCE(MIN(mpp.price), 0) AS min_price
    FROM
        MEDIA_PARTNER mp
    LEFT JOIN
        MEDIA_PARTNER_REVIEW mpr ON mp.id = mpr.mp_id
    LEFT JOIN
        MEDIA_PARTNER_PACKAGE mpp ON mp.id = mpp.mp_id
    WHERE 1 = 1
	`;

	let query_sp = `
    SELECT
        'sponsorship' AS service_type,
        sp.*,
        AVG(spr.rating) as average_rating,
        0 as min_price
    FROM
        SPONSORSHIP sp
    LEFT JOIN
        SPONSORSHIP_REVIEW spr ON sp.id = spr.sp_id
    WHERE 1 = 1
    `;

	const queryParams = [];

	Object.keys(filter).map((val) => {
		if (filter[val as keyof EventsFilter]) {
			if (val == "name") {
				query_mp += ` AND ${val} ILIKE '%' || $${
					queryParams.length + 1
				} || '%'`;
				query_sp += ` AND ${val} ILIKE '%' || $${
					queryParams.length + 1
				} || '%'`;
			} else {
				query_mp += ` AND ${val} = $${queryParams.length + 1}`;
				query_sp += ` AND ${val} = $${queryParams.length + 1}`;
			}
			queryParams.push(filter[val as keyof EventsFilter]);
		}
	});

	query_mp += ` GROUP BY mp.id`;
	query_sp += ` GROUP BY sp.id`;

	let query_all = `${query_sp} UNION ALL ${query_mp}`;

	if (sort_by && sort_method) {
		const allowedSortMethods = ["asc", "desc"];
		if (allowedSortMethods.includes(sort_method.toLowerCase())) {
			query_all += ` ORDER BY ${sort_by} ${sort_method}`;
		} else {
			throw new ApiError({
				code: ErrorCodes.badRequestErrorCode,
				details: "Wrong sorting method",
			});
		}
	}

	query_all += ` LIMIT $${queryParams.length + 1} OFFSET $${
		queryParams.length + 2
	}`;

	queryParams.push(limit, page * limit);

	console.log(query_all);
	const res = await dbQuery(query_all, queryParams);
	const total = await dbQuery(`SELECT COUNT(*) FROM (
        SELECT id FROM MEDIA_PARTNER UNION ALL SELECT id FROM SPONSORSHIP
    )`);
	const total_page = Math.ceil(total.rows[0].count / limit);
	return {
		total: parseInt(total.rows[0].count ?? 0),
		limit,
		page,
		total_page,
		data: res.rows ?? ([] as EventsData[]),
	};
};
