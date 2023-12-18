import { EventsData, Reviews, SocialMedia } from "../common.model";

export type RentalsPackages = {
    name: string;
    price: number;
    description: string;
};

export type GetRentalsDetailData = {
    social_media: SocialMedia[];
    packages: RentalsPackages[];
    reviews: Reviews[];
} & EventsData;

export type UpdateCreateRentalsBody = Exclude<
    GetRentalsDetailData,
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
