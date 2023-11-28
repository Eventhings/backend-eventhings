import { NextFunction, Request, Response } from "express";
import * as admin from "firebase-admin";
import { UserRole } from "../models";
import { ApiError, ErrorCodes } from "../utils";

export const isAuthenticated = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { authorization } = req.headers;
	if (!authorization || !authorization.startsWith("Bearer")) {
		next(
			new ApiError({
				code: ErrorCodes.unauthorizedErrorCode,
				details: "Unauthorized",
			})
		);
		return;
	}

	const split = authorization.split("Bearer ");
	if (split.length !== 2) {
		next(
			new ApiError({
				code: ErrorCodes.unauthorizedErrorCode,
				details: "Unauthorized",
			})
		);
		return;
	}

	const token = split[1];

	try {
		const decodedToken: admin.auth.DecodedIdToken = await admin
			.auth()
			.verifyIdToken(token);

		res.locals = {
			...res.locals,
			uid: decodedToken.uid,
			role: decodedToken.role,
			email: decodedToken.email,
		};
		return next();
	} catch (err) {
		let apiError = new ApiError({
			code: ErrorCodes.internalServerErrorCode,
			details: "",
		});

		if ((err as ApiError).code) {
			apiError = err as ApiError;
		}

		next(apiError);
	}
};

export const isAuthorized = ({
	allowedRoles,
	allowSelf,
}: {
	allowedRoles?: UserRole[];
	allowSelf?: boolean;
}) => {
	return (req: Request, res: Response, next: Function) => {
		const { role, uid } = res.locals;
		const { id } = req.params;

		if (allowSelf && id && uid === id) return next();

		if (!role) return res.status(403).send();

		if (allowedRoles?.includes(role)) return next();

		return res.status(403).send();
	};
};
