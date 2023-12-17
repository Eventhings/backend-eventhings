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

export type EventsData = {
	id: string;
	logo_url?: string;
	created_by: string;
	approved_by?: string;
	name: string;
	last_updated: Date;
	created_at: Date;
	is_approved: boolean;
	is_active: boolean;
	rating: number;
	field: string;
	value: string;
	description: string;
};

export type EventsFilter = {
	name: string;
	field: string;
	is_active: string;
	is_approved: string;
	is_archived: string;
	created_by: string;
	fees: "paid" | "free";
};
