import express, { Request, Response } from "express";

import {
	activateSponsorship,
	addSponsorshipReview,
	approveSponsorship,
	archiveSponsorship,
	createSponsorship,
	deleteMediaPartner,
	deleteSponsorshipReview,
	getAllSponsorship,
	getSponsorshipById,
	updateSponsorship,
	updateSponsorshipReview,
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
					field: params.field
						? (JSON.parse(
								(params.field as string).replace(/'/g, '"')
						  ) as string[])
						: undefined,
					is_active: (params.is_active as string) ?? undefined,
					is_approved: (params.is_approved as string) ?? undefined,
					is_archived: (params.is_archived as string) ?? undefined,
					created_by: (params.created_by as string) ?? undefined,
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

			throw apiError;
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
	"/:id/review",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const body = await req.body;
			const sp_id = req.params.id;
			await addSponsorshipReview({
				sp_id,
				reviewer_id: res.locals.uid,
				rating: body.rating,
				review: body.review,
			});

			return {
				status: 200,
				data: {
					...body,
				},
				message: `Added review to sponsorship ${sp_id} successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "Failed to add sponsorship review",
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

sponsorshipRoute.post(
	"/:id/archive",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const sp_id = req.params.id;
			const body = await req.body;

			const data = await archiveSponsorship({
				sp_id,
				is_archived: body.is_archived ?? true,
				res,
			});

			return {
				status: 200,
				data: data,
				message: `${
					body.is_archived ?? true ? "Archived" : "Unarchived"
				} media partner ${sp_id} successfully`,
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
	"/:id/review/:review_id",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const sp_id = req.params.id;
			const review_id = req.params.review_id;

			const data = await deleteSponsorshipReview({
				review_id,
				res,
			});

			return {
				status: 200,
				data: data,
				message: `Deleted sponsorship review ${review_id} for sponsorship ${sp_id} successfully`,
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
	"/:id/review/:review_id",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const sp_id = req.params.id;
			const review_id = req.params.review_id;
			const body = await req.body;

			const data = await updateSponsorshipReview({
				review_id,
				review: body.review,
				rating: body.rating,
				res,
			});

			return {
				status: 200,
				data: data,
				message: `Update sponsorship review ${review_id} for sponsorship ${sp_id} successfully`,
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
