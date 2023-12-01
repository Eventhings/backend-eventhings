import { NextFunction, Request, Response } from "express";
import { env } from "process";
import { ApiError, ErrorCodes } from "../utils";

export const protectEndpoint = (
	req: Request,
	_res: Response,
	next: NextFunction
): void => {
	const appToken = req.headers["x-app-token"];

	if (appToken !== env.APP_TOKEN) {
		next(
			new ApiError({
				code: ErrorCodes.unauthorizedErrorCode,
				details: "Unauthorized",
			})
		);
		return;
	}
	next();
};
