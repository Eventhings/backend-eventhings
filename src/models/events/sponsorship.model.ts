import { EventsData, Reviews, SocialMedia } from "../common.model";

export type GetSpnonsorshipDetailData = {
	social_media: SocialMedia[];
	reviews: Reviews[];
} & EventsData;

export type UpdateCreateSponsorshipBody = Exclude<
	GetSpnonsorshipDetailData,
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
