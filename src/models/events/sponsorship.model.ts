import { EventsData, Reviews} from "../common.model";

export type GetSponsorshipDetailData = {
	reviews: Reviews[];
} & EventsData;

export type UpdateCreateSponsorshipBody = Exclude<
	GetSponsorshipDetailData,
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
