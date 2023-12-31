import { EventsData, Reviews} from "../common.model";

export type RentalsPackages = {
    name: string;
    price: number;
    description: string;
};

export type GetRentalsDetailData = {
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
        "availability",
        "rating"
    ]
> & { logo: string };
