import { z } from "zod";

export const UserSchema = z.object({
	email: z.string().email({ message: "Invalid email format" }),
	password: z
		.string()
		.min(6, { message: "Password needed atleast 6 character" }),
});

export type User = z.infer<typeof UserSchema>;

const phoneRegex = new RegExp(
	/^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const dobRegex = new RegExp(
	"^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/\\d{4}$"
);
export const UpdateUserSchema = z.object({
	email: z.string().email({ message: "Invalid email format" }),
	name: z.string(),
	dob: z.string().regex(dobRegex, "Invalid Date (DD/MM/YYYY)"),
	phoneNumber: z.string().regex(phoneRegex, "Invalid Number"),
	location: z.string(),
});

export type UpdateUser = z.infer<typeof UpdateUserSchema>;
