import { backend } from "@/shared/api/backend";
import { waitlistSchema } from "./model";

export const getMyWaitlist = () => backend("/v1/me/waitlist", waitlistSchema);
