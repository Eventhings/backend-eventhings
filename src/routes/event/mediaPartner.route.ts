import express, { Request, Response } from "express";

import {
	activateMediaPartner,
	addMediaPartnerPackage,
	addMediaPartnerReview,
	addMediaPartnerSocial,
	approveMediaPartner,
	createMediaPartner,
	deleteMediaPartner,
	deleteMediaPartnerPackage,
	deleteMediaPartnerReview,
	deleteMediaPartnerSocial,
	getAllMediaPartner,
	getMediaPartnerById,
	updateMediaPartner,
	updateMediaPartnerPackage,
	updateMediaPartnerReview,
	updateMediaPartnerSocial,
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
					message: `Media partner ${mp_id} not found`,
				});
			}

			return {
				status: 200,
				data: {
					...res,
				},
				message: `Get media partner ${mp_id} successfully`,
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
				details: "Failed to create media partner",
			});
			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}
			throw apiError;
		}
	})
);

mediaPartnerRoute.post(
	"/:id/package",
	isAuthenticated,
	eventhingsResponse(async (req: Request) => {
		try {
			const body = await req.body;
			const mp_id = req.params.id;
			const data = await addMediaPartnerPackage({
				data: body.packages,
				mp_id,
			});

			return {
				status: 200,
				data: {
					...data,
				},
				message: `Added package to media partner ${mp_id} successfully`,
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

mediaPartnerRoute.post(
	"/:id/social",
	isAuthenticated,
	eventhingsResponse(async (req: Request) => {
		try {
			const body = await req.body;
			const mp_id = req.params.id;
			const data = await addMediaPartnerSocial({
				data: body.socials,
				mp_id,
			});

			return {
				status: 200,
				data: {
					...data,
				},
				message: `Added social media to media partner ${mp_id} successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "Failed to add media partner social media",
			});
			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}
			throw apiError;
		}
	})
);

mediaPartnerRoute.post(
	"/:id/review",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const body = await req.body;
			const mp_id = req.params.id;
			await addMediaPartnerReview({
				mp_id,
				reviewer_id: res.locals.uid,
				rating: body.rating,
				review: body.review,
			});

			return {
				status: 200,
				data: {
					...body,
				},
				message: `Added review to media partner ${mp_id} successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "Failed to add media partner review",
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
				mp_id,
				is_approved: body.is_approved ?? true,
			});

			return {
				status: 200,
				data: data,
				message: `${
					body.is_approved ?? true ? "Approved" : "Unapproved"
				} media partner ${mp_id} successfully`,
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
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const mp_id = req.params.id;
			const body = await req.body;

			const data = await activateMediaPartner({
				mp_id,
				is_active: body.is_active ?? true,
				res,
			});

			return {
				status: 200,
				data: data,
				message: `${
					body.is_active ?? true ? "Activated" : "Deactivated"
				} media partner ${mp_id} successfully`,
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
				message: `Deleted media partner ${mp_id} successfully`,
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
	"/:id/package/:package_id",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const mp_id = req.params.id;
			const package_id = req.params.package_id;

			await deleteMediaPartnerPackage({
				package_id,
				mp_id,
				res,
			});

			return {
				status: 200,
				data: null,
				message: `Deleted media partner package ${package_id} for media partner ${mp_id} successfully`,
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

mediaPartnerRoute.delete(
	"/:id/social/:social_id",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const mp_id = req.params.id;
			const social_id = req.params.social_id;

			await deleteMediaPartnerSocial({
				social_id,
				mp_id,
				res,
			});

			return {
				status: 200,
				data: null,
				message: `Deleted media partner social media ${social_id} for media partner ${mp_id} successfully`,
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

mediaPartnerRoute.delete(
	"/:id/review/:review_id",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const mp_id = req.params.id;
			const review_id = req.params.review_id;

			const data = await deleteMediaPartnerReview({
				review_id,
				res,
			});

			return {
				status: 200,
				data: data,
				message: `Deleted media partner review ${review_id} for media partner ${mp_id} successfully`,
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
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const mp_id = req.params.id;
			const body = await req.body;

			const data = await updateMediaPartner({ mp_id, data: body, res });

			return {
				status: 200,
				data: data,
				message: `Update media partner ${mp_id} successfully`,
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
	"/:id/package/:package_id",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const mp_id = req.params.id;
			const package_id = req.params.package_id;
			const body = await req.body;

			const data = await updateMediaPartnerPackage({
				package_id,
				mp_id,
				data: body,
				res,
			});

			return {
				status: 200,
				data: data,
				message: `Update media partner page ${package_id} for media partner ${mp_id} successfully`,
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
	"/:id/social/:social_id",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const mp_id = req.params.id;
			const social_id = req.params.social_id;
			const body = await req.body;

			const data = await updateMediaPartnerSocial({
				social_id,
				mp_id,
				data: body,
				res,
			});

			return {
				status: 200,
				data: data,
				message: `Update media partner social media ${social_id} for media partner ${mp_id} successfully`,
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
	"/:id/review/:review_id",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const mp_id = req.params.id;
			const review_id = req.params.review_id;
			const body = await req.body;

			const data = await updateMediaPartnerReview({
				review_id,
				review: body.review,
				rating: body.rating,
				res,
			});

			return {
				status: 200,
				data: data,
				message: `Update media partner review ${review_id} for media partner ${mp_id} successfully`,
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
