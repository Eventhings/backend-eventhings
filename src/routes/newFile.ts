import { ApiError, ErrorCodes, eventhingsResponse } from "../utils";
import { userRoutes } from "./user.route";

userRoutes.get(
	"/eventhings",
	eventhingsResponse(async () => {
		try {
			return {
				status: 200,
				data: null,
				message: "Eventhings APIs",
			};
		} finally {
		}
		atch(err);
		{
			let apiError = new ApiError({
				code: ErrorCodes.internalServerErrorCode,
			});

			if ((err as ApiError).code) {
				apiError = err as ApiError;
			}

			return apiError;
		}
	})
);
