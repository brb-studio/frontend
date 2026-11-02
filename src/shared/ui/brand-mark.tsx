import { Scissors } from "lucide-react";
import Image from "next/image";

export function BrandMark({
  size = "md",
  logo,
}: {
  size?: "md" | "lg";
  logo?: string;
}) {
  const box = size === "lg" ? "size-14 rounded-2xl" : "size-9 rounded-xl";
  if (logo) {
    return (
      <span
        aria-hidden="true"
        className={`relative shrink-0 overflow-hidden bg-surface ${box}`}
      >
        <Image
          src={logo}
          alt=""
          fill
          sizes={size === "lg" ? "56px" : "36px"}
          className="object-cover"
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 bg-accent place-items-center text-accent-fg ${box}`}
    >
      <Scissors size={size === "lg" ? 24 : 17} strokeWidth={2.25} />
    </span>
  );
}
