import express, { Request, Response } from "express";

import {
	activateSponsorship,
	addSponsorshipSocial,
	approveSponsorship,
	createSponsorship,
	deleteMediaPartner,
	deleteSponsorshipSocial,
	getAllSponsorship,
	getSponsorshipById,
	updateSponsorship,
	updateSponsorshipSocial,
} from "../../controllers";
import { isAuthenticated, isAuthorized } from "../../middlewares";
import { UserRole } from "../../models";
import { ApiError, ErrorCodes, eventhingsResponse } from "../../utils";

const sponsorshipRoute = express.Router();

sponsorshipRoute.get(
	"/",
	eventhingsResponse(async (req: Request) => {
		try {
			const params = await req.query;
			const res = await getAllSponsorship({
				limit: parseInt((params.limit ?? 10) as string),
				page: parseInt((params.page ?? 0) as string),
				filter: {
					name: (params.name as string) ?? undefined,
					field: (params.field as string) ?? undefined,
					is_active: (params.is_active as string) ?? undefined,
				},
				sort_by: (params.sort_by as string) ?? undefined,
				sort_method: (params.sort_method as string) ?? undefined,
			});
			return {
				status: 200,
				data: {
					...res,
				},
				message: "Get all sponsorship successfully",
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

sponsorshipRoute.get(
	"/:id",
	eventhingsResponse(async (req: Request) => {
		try {
			const sp_id = req.params.id;
			const res = await getSponsorshipById({ id: sp_id });

			if (!res.id) {
				throw new ApiError({
					code: ErrorCodes.notFoundErrorCode,
					message: `Sponsorship ${sp_id} not found`,
				});
			}

			return {
				status: 200,
				data: {
					...res,
				},
				message: `Get sponsorship ${sp_id} successfully`,
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

sponsorshipRoute.post(
	"/",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const body = await req.body;
			const data = await createSponsorship({
				data: body,
				created_by: res.locals.uid,
			});

			return {
				status: 200,
				data: {
					...data,
				},
				message: "Created sponsorship successfully",
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "Failed to create sponsorship",
			});
			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}
			throw apiError;
		}
	})
);

sponsorshipRoute.post(
	"/:id/social",
	isAuthenticated,
	eventhingsResponse(async (req: Request) => {
		try {
			const body = await req.body;
			const sp_id = req.params.id;
			const data = await addSponsorshipSocial({
				data: body.socials,
				sp_id,
			});

			return {
				status: 200,
				data: {
					...data,
				},
				message: `Added social media to sponsorship ${sp_id} successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "Failed to add sponsorship package",
			});
			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}
			throw apiError;
		}
	})
);

sponsorshipRoute.post(
	"/:id/approve",
	isAuthenticated,
	isAuthorized({ allowedRoles: [UserRole.ADMIN] }),
	eventhingsResponse(async (req: Request) => {
		try {
			const sp_id = req.params.id;
			const body = await req.body;
			const data = await approveSponsorship({
				sp_id,
				is_approved: body.is_approved ?? true,
			});

			return {
				status: 200,
				data: data,
				message: `${
					body.is_approved ?? true ? "Approved" : "Unapproved"
				} sponsorship ${sp_id} successfully`,
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

sponsorshipRoute.post(
	"/:id/activate",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const sp_id = req.params.id;
			const body = await req.body;

			const data = await activateSponsorship({
				sp_id,
				is_active: body.is_active ?? true,
				res,
			});

			return {
				status: 200,
				data: data,
				message: `${
					body.is_active ?? true ? "Activated" : "Deactivated"
				} sponsorship ${sp_id} successfully`,
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

sponsorshipRoute.delete(
	"/:id",
	isAuthenticated,
	eventhingsResponse(async (req: Request) => {
		try {
			const sp_id = req.params.id;
			await deleteMediaPartner({ id: sp_id });

			return {
				status: 200,
				data: null,
				message: `Deleted media partner ${sp_id} successfully`,
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

sponsorshipRoute.delete(
	"/:id/social/:social_id",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const sp_id = req.params.id;
			const social_id = req.params.social_id;

			await deleteSponsorshipSocial({
				social_id,
				sp_id,
				res,
			});

			return {
				status: 200,
				data: null,
				message: `Deleted media partner social media ${social_id} for media partner ${sp_id} successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "Failed to add media partner package",
			});
			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}
			throw apiError;
		}
	})
);

sponsorshipRoute.patch(
	"/:id",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const sp_id = req.params.id;
			const body = await req.body;

			const data = await updateSponsorship({ sp_id, data: body, res });

			return {
				status: 200,
				data: data,
				message: `Update media partner ${sp_id} successfully`,
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

sponsorshipRoute.patch(
	"/:id/social/:social_id",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const sp_id = req.params.id;
			const social_id = req.params.social_id;
			const body = await req.body;

			const data = await updateSponsorshipSocial({
				social_id,
				sp_id,
				data: body,
				res,
			});

			return {
				status: 200,
				data: data,
				message: `Update media partner social media ${social_id} for media partner ${sp_id} successfully`,
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

export default sponsorshipRoute;
