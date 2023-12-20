import axios from "axios";
import { dbQuery } from "../../db";
import { ServiceType } from "../../models";
import { UpdateCreateUserPurchase } from "../../models/purchase/purchase.model";
import { ApiError, ErrorCodes } from "../../utils";

export const getAllUserPurchase = async ({ userId }: { userId: string }) => {
	const user_purchases = await dbQuery(
		`
	SELECT up.id AS user_purchase_id,
		up.created_at,
		up.user_id,
		up.service_id,
		up.service_type,
		up.status,
		up.payment_link,
		up.total,
		coalesce(mp.name, sp.name) AS partner_name
	FROM USER_PURCHASES up
	LEFT JOIN (
		SELECT 'media_partner' AS service_type, mp.id, mp.name 
		FROM MEDIA_PARTNER mp
	) mp ON up.service_id = mp.id AND up.service_type = mp.service_type
	LEFT JOIN (
		SELECT 'sponsorship' AS service_type, sp.id, sp.name 
		FROM sponsorship sp
	) sp ON up.service_id = sp.id AND up.service_type = sp.service_type 
	WHERE user_id = $1;
`,
		[userId]
	);
	return user_purchases;
};

export const getAllServicePurchase = async ({
	serviceId,
}: {
	serviceId: string;
}) => {
	const service_purchase = await dbQuery(
		`
	SELECT up.id AS user_purchase_id,
		up.created_at,
		up.user_id,
		up.service_id,
		up.service_type,
		up.status,
		up.payment_link,
		up.total,
		coalesce(mp.name, sp.name) AS partner_name
	FROM USER_PURCHASES up
	LEFT JOIN (
		SELECT 'media_partner' AS service_type, mp.id, mp.name 
		FROM MEDIA_PARTNER mp
	) mp ON up.service_id = mp.id AND up.service_type = mp.service_type
	LEFT JOIN (
		SELECT 'sponsorship' AS service_type, sp.id, sp.name 
		FROM sponsorship sp
	) sp ON up.service_id = sp.id AND up.service_type = sp.service_type 
	WHERE service_id = $1;
`,
		[serviceId]
	);
	return service_purchase;
};

export const createUserPurchase = async ({
	data,
}: {
	data: UpdateCreateUserPurchase;
}) => {
	const user_purchase_result = await dbQuery(
		`
        INSERT INTO USER_PURCHASES (service_id, user_id, service_type, status) VALUES ($1, $2, $3, $4) RETURNING id;
    `,
		[data.service_id, data.user_id, data.service_type, data.status]
	);
	const purchase_id = user_purchase_result.rows[0]?.id;

	for (const val of data.packages || []) {
		await dbQuery(
			`INSERT INTO PURCHASE_ITEM (purchase_id, package_id, quantity)
			VALUES ($1, $2, $3)`,
			[purchase_id, val.package_id, val.quantity]
		);
	}

	let packages_detail = [];
	let packages: any[] = [];
	let total_amount = 0;

	if (data.service_type === ServiceType.MEDIA_PARTNER) {
		packages = (
			await dbQuery(`
            SELECT pi.*, mpp.*
            FROM PURCHASE_ITEM pi
            JOIN media_partner_package mpp ON pi.package_id = mpp.id;	
        `)
		).rows;
	} else if (data.service_type === ServiceType.RENTALS) {
		packages = (
			await dbQuery(`
            SELECT pi.*, rp.*
            FROM PURCHASE_ITEM pi
            JOIN rentals_package rp ON pi.package_id = rp.id;	
        `)
		).rows;
	}

	packages_detail = data.packages.map((val) => {
		let temp = packages.find((pkg) => pkg.id === val.package_id);

		if (!temp) {
			throw new ApiError({
				code: ErrorCodes.notFoundErrorCode,
				message: `Package is not available for ${data.service_id}`,
			});
		}
		total_amount += (parseInt(val.quantity) * temp.price ?? 0) as number;
		return {
			id: temp.package_id,
			name: temp.name,
			price: temp.price,
			quantity: val.quantity,
			brand: temp.mp_id || temp.sp_id,
			category:
				data.service_type === ServiceType.MEDIA_PARTNER
					? "Media Partner"
					: data.service_type === ServiceType.RENTALS
					? "Rentals"
					: "",
			merchant_name: temp.mp_id || temp.sp_id,
		};
	});

	let purchase_link;
	try {
		purchase_link = await axios.post(
			`${process.env.MIDTRANS_SANDBOX_URL}/v1/payment-links`,
			{
				transaction_details: {
					order_id: purchase_id,
					gross_amount: total_amount,
					payment_link_id: purchase_id,
				},
				customer_required: false,
				credit_card: {
					secure: true,
					bank: "bca",
					installment: {
						required: false,
						terms: {
							bni: [3, 6, 12],
							mandiri: [3, 6, 12],
							cimb: [3],
							bca: [3, 6, 12],
							offline: [6, 12],
						},
					},
				},
				usage_limit: 1,
				expiry: {
					start_time: new Date().toString(),
					duration: 20,
					unit: "days",
				},
				enabled_payments: ["credit_card", "bca_va", "indomaret"],
				item_details: [...packages_detail],
				customer_details: {
					first_name: "User",
					last_name: "Eventhings",
					email: data.email,
					phone: "0812345678",
					notes: "Thank you for your purchase. Please follow the instructions to pay.",
				},
			},
			{
				headers: {
					Authorization: `Basic U0ItTWlkLXNlcnZlci1wVGZmRlBHem0wNkswV1BlRmxUWEp2SFE6`,
				},
			}
		);
	} catch (err) {
		console.error(err);
	}

	await dbQuery(
		`
		UPDATE USER_PURCHASES 
		SET payment_link = $1, total = $2
		WHERE id = $3
	`,
		[purchase_link?.data.payment_url, total_amount, purchase_id]
	);

	return {
		total_amount,
		purchases: [...packages_detail],
		payment_link: purchase_link?.data.payment_url,
		order_id: purchase_link?.data.order_id,
	};
};

export const updatePurchaseStatus = async ({
	order_id,
	status,
}: {
	order_id: string;
	status: string;
}) => {
	await dbQuery(
		`
		UPDATE USER_PURCHASES 
		SET status = $1
		WHERE id = $2
	`,
		[status, order_id]
	);
	return {
		order_id,
		status,
	};
};
