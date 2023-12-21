import axios from "axios";
import { dbQuery } from "../../db";
import { ServiceType } from "../../models";
import { ML_API_URL } from "../../utils";

export const recommendCF = async ({ user_id }: { user_id: string }) => {
	const recommendation = await axios.post(
		`${ML_API_URL}/recsys/cf/recommend`,
		{
			user_id,
		}
	);

	const recommend_query = `
        select * from
        (SELECT
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
        GROUP BY mp.id
        union all
        SELECT
            'sponsorship' AS service_type,
            sp.*,
            AVG(spr.rating) as average_rating,
            0 as min_price
        FROM
            SPONSORSHIP sp
        LEFT JOIN
            SPONSORSHIP_REVIEW spr ON sp.id = spr.sp_id
        GROUP BY sp.id
        union all
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
        GROUP BY rt.id    
        ) as ev
        where ev.id in (${recommendation.data.data.recommendations
			.map((str: string) => `'${str}'`)
			.join(", ")})
	`;

	const recommendation_data = await dbQuery(recommend_query);

	return recommendation_data.rows;
};

export const recommendCB = async ({
	service_id,
	category,
}: {
	service_id: string;
	category: ServiceType;
}) => {
	const recommendation = await axios.get(
		`${ML_API_URL}/cb-recsys/${category}/${service_id}`
	);

	let query: string;

	if (category === ServiceType.MEDIA_PARTNER) {
		query = `
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
            where m.id in (${recommendation.data.data.recommendation
				.map((str: string) => `'${str}'`)
				.join(", ")})
            GROUP BY m.id
        `;
	} else if (category === ServiceType.SPONSORSHIP) {
		query = `
            SELECT
                s.*,
                AVG(r.rating) AS average_rating
            FROM
                sponsorship s
            LEFT JOIN
                sponsorship_review r ON s.id = r.sp_id
            where s.id in (${recommendation.data.data.recommendation
				.map((str: string) => `'${str}'`)
				.join(", ")})
            GROUP BY s.id
        `;
	} else {
		query = `
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
            where rtl.id in (${recommendation.data.data.recommendation
				.map((str: string) => `'${str}'`)
				.join(", ")})
            GROUP BY rtl.id
        `;
	}

	const recommendation_data = await dbQuery(query);

	return recommendation_data.rows;
};
