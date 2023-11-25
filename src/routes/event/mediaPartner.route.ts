import express, { Request } from "express";

import {
	activateMediaPartner,
	approveMediaPartner,
	createMediaPartner,
	deleteMediaPartner,
	getAllMediaPartner,
	getMediaPartnerById,
	updateMediaPartner,
} from "../../controllers";
import { ApiError, ErrorCodes, eventhingsResponse } from "../../utils";

const mediaPartnerRoute = express.Router();

mediaPartnerRoute.get(
	"/",
	eventhingsResponse(async (req: Request) => {
		try {
			const params = await req.query;
			const res = await getAllMediaPartner({
				limit: parseInt((params.limit ?? 10) as string),
				page: parseInt((params.page ?? 0) as string),
			});
			return {
				status: 201,
				data: {
					...res,
				},
				message: "Get all media partner successfully",
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "",
			});

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			throw apiError;
		}
	})
);

mediaPartnerRoute.get(
	"/:id",
	eventhingsResponse(async (req: Request) => {
		try {
			const mp_id = req.params.id;
			const res = await getMediaPartnerById({ id: mp_id });

			if (!res.id) {
				throw new ApiError({
					code: ErrorCodes.notFoundErrorCode,
					message: `Media partner with id ${mp_id} not found`,
				});
			}

			return {
				status: 201,
				data: {
					...res,
				},
				message: `Get media partner with id ${mp_id} successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "",
			});

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			return apiError;
		}
	})
);

mediaPartnerRoute.post(
	"/",
	eventhingsResponse(async (req: Request) => {
		try {
			const body = await req.body;
			const res = await createMediaPartner({
				data: body as any,
			});

			return {
				status: 200,
				data: {
					...res,
				},
				message: "Created media partner successfully",
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "Failed to craete media partner",
			});
			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}
			throw apiError;
		}
	})
);

mediaPartnerRoute.post(
	"/:id/approve",
	eventhingsResponse(async (req: Request) => {
		try {
			const mp_id = req.params.id;
			const body = await req.body;

			const data = await approveMediaPartner({
				id: mp_id,
				is_approved: body.is_approved ?? true,
			});

			return {
				status: 200,
				data: data,
				message: `${
					body.is_approved ?? true ? "Approved" : "Unapproved"
				} media partner with id ${mp_id} successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "",
			});
			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}
			throw apiError;
		}
	})
);

mediaPartnerRoute.post(
	"/:id/activate",
	eventhingsResponse(async (req: Request) => {
		try {
			const mp_id = req.params.id;
			const body = await req.body;

			const data = await activateMediaPartner({
				id: mp_id,
				is_active: body.is_active ?? true,
			});

			return {
				status: 200,
				data: data,
				message: `${
					body.is_active ?? true ? "Activated" : "Deactivated"
				} media partner with id ${mp_id} successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "",
			});
			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}
			throw apiError;
		}
	})
);

mediaPartnerRoute.delete(
	"/:id",
	eventhingsResponse(async (req: Request) => {
		try {
			const mp_id = req.params.id;
			await deleteMediaPartner({ id: mp_id });

			return {
				status: 200,
				data: null,
				message: `Deleted media partner with id ${mp_id} successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "",
			});
			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}
			throw apiError;
		}
	})
);

mediaPartnerRoute.patch(
	"/:id",
	eventhingsResponse(async (req: Request) => {
		try {
			const mp_id = req.params.id;
			const body = await req.body;

			const data = await updateMediaPartner({ id: mp_id, data: body });

			return {
				status: 200,
				data: data,
				message: `Update media partner with id ${mp_id} successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "",
			});
			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}
			throw apiError;
		}
	})
);

export default mediaPartnerRoute;
