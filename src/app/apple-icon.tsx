import { brandIcon } from "./pwa/brand-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The iPhone home-screen icon. */
export default function AppleIcon() {
  return brandIcon(180);
}
