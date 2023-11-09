import { ServicePackages, SocialMedia } from "../common.model";

export type GetAllMediaPartnerData = {
	id: string;
	created_by: string;
	approved_by?: string;
	name: string;
	last_updated: Date;
	created_at: Date;
	is_approved: boolean;
	rating: number;
	field: string;
};

export type GetMediaPartnerDetailData = {
	value: string;
	social_media: SocialMedia[];
	packages: ServicePackages[];
} & GetAllMediaPartnerData;

export type CreateMediaPartnerBody = Exclude<
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
>;
