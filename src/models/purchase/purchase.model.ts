import { PurchaseStatus, ServiceType } from "..";

export type ServicePackages = {
	package_id: string;
	quantity: string;
};

export type UpdateCreateUserPurchase = {
	service_id: string;
	email: string;
	user_id: string;
	service_type: ServiceType;
	status: PurchaseStatus;
	packages: ServicePackages[];
};
