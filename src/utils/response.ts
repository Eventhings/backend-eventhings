import { NextFunction, Request, Response } from "express";

export enum ErrorCodes {
	notFoundErrorCode = "notFoundError",
	badRequestErrorCode = "badRequestError",
	internalServerErrorCode = "internalServerError",
	validationErrorCode = "validationError",
	unauthorizedErrorCode = "unauthorizedError",
	forbiddenErrorCode = "forbiddenErrorCode",
	tooManyRequestsErrorCode = "tooManyRequestsErrorCode",
}

type ErrorCodeMap = {
	[key in ErrorCodes]: {
		status: number;
		message: string;
	};
};

export const errors: ErrorCodeMap = {
	[ErrorCodes.badRequestErrorCode]: {
		status: 400,
		message: `Bad request`,
	},
	[ErrorCodes.notFoundErrorCode]: {
		status: 404,
		message: `Resource not found`,
	},
	[ErrorCodes.internalServerErrorCode]: {
		status: 500,
		message: `Internal server error`,
	},
	[ErrorCodes.validationErrorCode]: {
		status: 422,
		message: `Validation error`,
	},
	[ErrorCodes.unauthorizedErrorCode]: {
		status: 401,
		message: `Unauthorized`,
	},
	[ErrorCodes.forbiddenErrorCode]: {
		status: 403,
		message: `Not allowed to access the resource`,
	},
	[ErrorCodes.tooManyRequestsErrorCode]: {
		status: 429,
		message: `Too many requests in this timeframe`,
	},
};

export const eventhingsResponse =
	(fn: Function) =>
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { status = 200, data, message } = await fn(req, res);
			res.status(status).send({
				success: true,
				data: data,
				status: status,
				message: message,
			});
		} catch (err) {
			next(err);
		}
	};

export class ApiError extends Error {
	code: ErrorCodes;
	message: string;
	status: number;
	details?: string | null;
	constructor({
		code,
		message,
		status,
		details,
	}: {
		code: ErrorCodes;
		message?: string;
		status?: number;
		details?: string;
	}) {
		super();
		this.code = code;
		this.message = message || errors[code].message;
		this.status = status || errors[code].status;
		this.details = details || null;
	}
}
