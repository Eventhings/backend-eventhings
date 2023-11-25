import { NextFunction, Request, Response } from "express";

const errorHandler = (
	err: any,
	_req: Request,
	res: Response,
	_next: NextFunction
): void => {
	const errStatus = err.statusCode || 500;
	const errMsg = err.message || "Something went wrong";
	res.setHeader("Content-Type", "application/json");

	res.status(errStatus).json({
		success: false,
		status: errStatus,
		message: errMsg,
	});
};

export default errorHandler;
