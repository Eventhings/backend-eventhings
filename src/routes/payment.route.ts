import axios from "axios";
import express from "express";
import { env } from "process";

export const paymentRoute = express.Router();

paymentRoute.get("/", () => {
	axios.post(`${env.MIDTRANS_SANDBOX_URL}/v1/payment-links`);
});
