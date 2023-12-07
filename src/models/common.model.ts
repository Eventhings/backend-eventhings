export type SocialMedia = {
	social_media: string;
	link: string;
};

export type Reviews = {
	user_id: string;
	rating: number;
	review: string;
};

export enum UserRole {
	ADMIN = "admin",
	STANDARD = "standard",
	BUSINESS = "business",
}
