import { EventsData, Reviews, SocialMedia } from "../common.model";

export type MediaPartnerPackages = {
	name: string;
	price: number;
	description: string;
};

export type GetMediaPartnerDetailData = {
	social_media: SocialMedia[];
	packages: MediaPartnerPackages[];
	reviews: Reviews[];
} & EventsData;

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
