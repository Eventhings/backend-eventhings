import express, { Request, Response } from "express";

import {
	activateRentals,
	addRentalsPackage,
	addRentalsReview,
	approveRentals,
	archiveRentals,
	createRentals,
	deleteRentals,
	deleteRentalsPackage,
	deleteRentalsReview,
	getAllRentals,
	getRentalsById,
	updateRentals,
	updateRentalsPackage,
	updateRentalsReview,
} from "../../controllers";
import { isAuthenticated, isAuthorized } from "../../middlewares";
import { UserRole } from "../../models";
import { ApiError, ErrorCodes, eventhingsResponse } from "../../utils";

const rentalsRoute = express.Router();

rentalsRoute.get(
	"/", 
	eventhingsResponse(async (req: Request) => {
	try {
		const params = await req.query;
			const res = await getAllRentals({
				limit: parseInt((params.limit ?? 10) as string),
				page: parseInt((params.page ?? 0) as string),
				filter: {
					name: (params.name as string) ?? undefined,
					field: (params.field as string) ?? undefined,
					is_active: (params.is_active as string) ?? undefined,
					is_approved: (params.is_approved as string) ?? undefined,
					is_archived: (params.is_archived as string) ?? undefined,
					created_by: (params.created_by as string) ?? undefined,
					fees: (params.fees as "paid" | "free") ?? undefined,
					location: (params.location as string) ?? undefined,
				},
				sort_by: (params.sort_by as string) ?? undefined,
				sort_method: (params.sort_method as string) ?? undefined,
	});
	return {
		status: 200,
		data: {
			...res,
		},
		message: "Get all rentals successfully",
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

rentalsRoute.get(
	"/:id",
	eventhingsResponse(async (req: Request) => {
		try {
			const rt_id = req.params.id;
			const res = await getRentalsById({ id: rt_id });

			if (!res.id) {
				throw new ApiError({
					code: ErrorCodes.notFoundErrorCode,
					message: `Rentals ${rt_id} not found`,
				});
			}

			return {
				status: 200,
				data: {
					...res,
				},
				message: `Get Rental ${rt_id} successfully`,
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

rentalsRoute.post(
	"/",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const body = await req.body;
			const data = await createRentals({
				data: body,
				created_by: res.locals.uid,
			});

			return {
				status: 200,
				data: {
					...data,
				},
				message: "Created rentals successfully",
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "Failed to create rentals",
			});
			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}
			throw apiError;
		}
	})
);

rentalsRoute.post(
	"/:id/package",
	isAuthenticated,
	eventhingsResponse(async (req: Request) => {
		try {
			const body = await req.body;
			const rt_id = req.params.id;
			const data = await addRentalsPackage({
				data: body.packages,
				rt_id,
			});

			return {
				status: 200,
				data: {
					...data,
				},
				message: `Added package to rentals ${rt_id} successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "Failed to add rentals package",
			});
			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}
			throw apiError;
		}
	})
);

rentalsRoute.post(
	"/:id/review",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const body = await req.body;
			const rt_id = req.params.id;
			await addRentalsReview({
				rt_id,
				reviewer_id: res.locals.uid,
				rating: body.rating,
				review: body.review,
			});

			return {
				status: 200,
				data: {
					...body,
				},
				message: `Added review to rentals ${rt_id} successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "Failed to add rentals review",
			});
			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}
			throw apiError;
		}
	})
);

rentalsRoute.post(
	"/:id/approve",
	isAuthenticated,
	isAuthorized({ allowedRoles: [UserRole.ADMIN] }),
	eventhingsResponse(async (req: Request) => {
		try {
			const rt_id = req.params.id;
			const body = await req.body;
			const data = await approveRentals({
				rt_id,
				is_approved: body.is_approved ?? true,
			});

			return {
				status: 200,
				data: data,
				message: `${
					body.is_approved ?? true ? "Approved" : "Unapproved"
				} rentals ${rt_id} successfully`,
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

rentalsRoute.post(
	"/:id/activate",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const rt_id = req.params.id;
			const body = await req.body;

			const data = await activateRentals({
				rt_id,
				is_active: body.is_active ?? true,
				res,
			});

			return {
				status: 200,
				data: data,
				message: `${
					body.is_active ?? true ? "Activated" : "Deactivated"
				} rentals ${rt_id} successfully`,
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

rentalsRoute.post(
	"/:id/archive",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const rt_id = req.params.id;
			const body = await req.body;

			const data = await archiveRentals({
				rt_id,
				is_archived: body.is_archived ?? true,
				res,
			});

			return {
				status: 200,
				data: data,
				message: `${
					body.is_archived ?? true ? "Archived" : "Unarchived"
				} rentals ${rt_id} successfully`,
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

rentalsRoute.delete(
	"/:id",
	isAuthenticated,
	eventhingsResponse(async (req: Request) => {
		try {
			const rt_id = req.params.id;
			await deleteRentals({ id: rt_id });

			return {
				status: 200,
				data: null,
				message: `Deleted rentals ${rt_id} successfully`,
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

rentalsRoute.delete(
	"/:id/package/:package_id",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const rt_id = req.params.id;
			const package_id = req.params.package_id;

			await deleteRentalsPackage({
				package_id,
				rt_id,
				res,
			});

			return {
				status: 200,
				data: null,
				message: `Deleted rentals package ${package_id} for rentals ${rt_id} successfully`,
			};
		} catch (err) {
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
				details: "Failed to add rentals package",
			});
			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}
			throw apiError;
		}
	})
);

rentalsRoute.delete(
	"/:id/review/:review_id",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const rt_id = req.params.id;
			const review_id = req.params.review_id;

			const data = await deleteRentalsReview({
				review_id,
				res,
			});

			return {
				status: 200,
				data: data,
				message: `Deleted rentals review ${review_id} for rentals ${rt_id} successfully`,
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

rentalsRoute.patch(
	"/:id",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const rt_id = req.params.id;
			const body = await req.body;

			const data = await updateRentals({ rt_id, data: body, res });

			return {
				status: 200,
				data: data,
				message: `Update rentals ${rt_id} successfully`,
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

rentalsRoute.patch(
	"/:id/package/:package_id",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const rt_id = req.params.id;
			const package_id = req.params.package_id;
			const body = await req.body;

			const data = await updateRentalsPackage({
				package_id,
				rt_id,
				data: body,
				res,
			});

			return {
				status: 200,
				data: data,
				message: `Update rentals page ${package_id} for rentals ${rt_id} successfully`,
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

rentalsRoute.patch(
	"/:id/review/:review_id",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const rt_id = req.params.id;
			const review_id = req.params.review_id;
			const body = await req.body;

			const data = await updateRentalsReview({
				review_id,
				review: body.review,
				rating: body.rating,
				res,
			});

			return {
				status: 200,
				data: data,
				message: `Update rentals review ${review_id} for rentals ${rt_id} successfully`,
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

export default rentalsRoute;
