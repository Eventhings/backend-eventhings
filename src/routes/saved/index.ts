import express, { Request, Response } from "express";
import { getUserSaved, saveService, unsaveService } from "../../controllers";
import { isAuthenticated } from "../../middlewares";
import { ApiError, ErrorCodes, eventhingsResponse } from "../../utils";

const savedRoute = express.Router();

savedRoute.get(
	"/",
	isAuthenticated,
	eventhingsResponse(async (_req: Request, res: Response) => {
		try {
			const { uid } = res.locals;
			const user_saved = await getUserSaved({ user_id: uid });

			return {
				status: 200,
				data: {
					saved: user_saved.rows,
				},
				message: `Get all user ${uid} saved successfully`,
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

savedRoute.post(
	"/add",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const body = req.body;
			const { uid } = res.locals;

			await saveService({
				user_id: uid,
				service_id: body.service_id,
				service_type: body.service_type,
			});

			return {
				status: 200,
				data: {
					user_id: uid,
					service_id: body.service_id,
					service_type: body.service_type,
				},
				message: `Saved service ${body.service_id} successfully`,
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

savedRoute.delete(
	"/delete/:savedId",
	isAuthenticated,
	eventhingsResponse(async (req: Request, res: Response) => {
		try {
			const params = req.params;
			await unsaveService({
				res: res,
				saved_id: params.savedId,
			});

			return {
				status: 200,
				data: null,
				message: `Unsaved service ${params.savedId} successfully`,
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

export default savedRoute;
