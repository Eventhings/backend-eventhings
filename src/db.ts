import { env } from "process";

const { Pool } = require("pg");

const pool = new Pool({
	user: env.DB_USERNAME,
	password: env.DB_PASSWORD,
	host: env.DB_HOST,
	port: env.DB_PORT,
	database: env.DB_DATABASE,
});
export const dbQuery = (text: string, params?: any) => pool.query(text, params);
