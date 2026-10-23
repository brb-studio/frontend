import { notFound } from "next/navigation";

/** Any other path on the marketing host (/es/home, /es/admin…) is a 404 of the marketing site. */
export default function MarketingCatchAll() {
  notFound();
}
