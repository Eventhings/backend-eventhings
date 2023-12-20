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

	let query_rt = `
    SELECT
        'rentals' AS service_type,
        rt.*,
        AVG(rtr.rating) as average_rating,
        COALESCE(MIN(rtp.price), 0) AS min_price
    FROM
        RENTALS rt
    LEFT JOIN
        RENTALS_REVIEW rtr ON rt.id = rtr.rt_id
    LEFT JOIN
        RENTALS_PACKAGE rtp ON rt.id = rtp.rt_id
    WHERE 1 = 1
	`;

	const queryParams: any[] = [];

	Object.keys(filter).map((val) => {
		if (filter[val as keyof EventsFilter]) {
			if (val === "field") {
				filter["field"]?.map((field, index) => {
					query_mp += ` ${index === 0 ? "AND" : "OR"} mp.${val} = $${
						queryParams.length + 1
					}`;
					query_sp += ` ${index === 0 ? "AND" : "OR"} sp.${val} = $${
						queryParams.length + 1
					}`;
					query_rt += ` ${index === 0 ? "AND" : "OR"} rt.${val} = $${
						queryParams.length + 1
					}`;
					queryParams.push(field);
				});
			} else {
				if (val == "name") {
					query_mp += ` AND ${val} ILIKE '%' || $${
						queryParams.length + 1
					} || '%'`;
					query_sp += ` AND ${val} ILIKE '%' || $${
						queryParams.length + 1
					} || '%'`;
				} else if (val == "service_type") {
					query_mp += ` AND 'media_partner' = $${
						queryParams.length + 1
					}`;
					query_sp += ` AND 'sponsorship' = $${
						queryParams.length + 1
					}`;
					query_rt += ` AND 'rentals' = $${queryParams.length + 1}`;
				} else {
					query_mp += ` AND ${val} = $${queryParams.length + 1}`;
					query_sp += ` AND ${val} = $${queryParams.length + 1}`;
					query_rt += ` AND ${val} = $${queryParams.length + 1}`;
				}
				queryParams.push(filter[val as keyof EventsFilter]);
			}
		}
	});

	query_mp += ` GROUP BY mp.id`;
	query_sp += ` GROUP BY sp.id`;
	query_rt += ` GROUP BY rt.id`;

	let query_all = `${query_sp} UNION ALL ${query_mp} UNION ALL ${query_rt}`;

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

	const total = await dbQuery(
		`SELECT COUNT(*) FROM (
		${query_all}
    ) as services`,
		queryParams
	);

	query_all += ` LIMIT $${queryParams.length + 1} OFFSET $${
		queryParams.length + 2
	}`;

	queryParams.push(limit, page * limit);
	const res = await dbQuery(query_all, queryParams);

	const total_page = Math.ceil(total.rows[0].count / limit);
	return {
		total: parseInt(total.rows[0].count ?? 0),
		limit,
		page,
		total_page,
		data: res.rows ?? ([] as EventsData[]),
	};
};
