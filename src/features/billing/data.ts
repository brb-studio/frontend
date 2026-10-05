import { backend } from "@/shared/api/backend";
import { billingSchema } from "./model";

export const getBilling = () => backend("/v1/billing", billingSchema);
