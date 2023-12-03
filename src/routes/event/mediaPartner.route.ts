import express, { Request, Response } from "express";

import {
	activateMediaPartner,
	approveMediaPartner,
	createMediaPartner,
	deleteMediaPartner,
	getAllMediaPartner,
	getMediaPartnerByCreator,
	getMediaPartnerById,
	updateMediaPartner,
} from "../../controllers";
import { isAuthenticated, isAuthorized } from "../../middlewares";
import { UserRole } from "../../models";
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
				status: 200,
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
				status: 200,
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

mediaPartnerRoute.get(
	"/business/:creator_id",
	eventhingsResponse(async (req: Request) => {
		try {
			const creator_id = req.params.creator_id;

			const params = await req.query;
			const res = await getMediaPartnerByCreator({
				creator_id,
				limit: parseInt((params.limit ?? 10) as string),
				page: parseInt((params.page ?? 0) as string),
			});
			return {
				status: 200,
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

mediaPartnerRoute.post(
	"/",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const body = await req.body;
			const data = await createMediaPartner({
				data: body,
				created_by: res.locals.uid,
			});

			return {
				status: 200,
				data: {
					...data,
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
	isAuthenticated,
	isAuthorized({ allowedRoles: [UserRole.ADMIN] }),
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
	isAuthenticated,
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
	isAuthenticated,
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
	isAuthenticated,
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
