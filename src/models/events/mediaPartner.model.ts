import { Reviews, SocialMedia } from "../common.model";

export type MediaPartnerPackages = {
	name: string;
	price: number;
	description: string;
};

export type GetAllMediaPartnerData = {
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
};

export type GetMediaPartnerDetailData = {
	value: string;
	description: string;
	social_media: SocialMedia[];
	packages: MediaPartnerPackages[];
	reviews: Reviews[];
} & GetAllMediaPartnerData;

export type UpdateCreateMediaPartnerBody = Exclude<
	GetMediaPartnerDetailData,
	[
		"created_by",
		"id",
		"approved_by",
		"last_updated",
		"created_at",
		"is_approved",
		"rating"
	]
> & { logo: string };
