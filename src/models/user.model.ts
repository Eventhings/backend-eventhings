import { z } from "zod";

export const UserSchema = z.object({
	email: z.string().email({ message: "Invalid email format" }),
	password: z
		.string()
		.min(6, { message: "Password needed atleast 6 character" }),
});

export type User = z.infer<typeof UserSchema>;
