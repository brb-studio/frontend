import { backend } from "@/shared/api/backend";
import {
  availabilityPath,
  availabilitySchema,
  type BookingTarget,
} from "./model";

/** Server side of the availability query: same data the /api route returns to the browser. */
export const getAvailability = (target: BookingTarget) =>
  backend(
    `/v1/public/availability?${availabilityPath(target)}`,
    availabilitySchema,
  );
