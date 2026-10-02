import { Scissors } from "lucide-react";

export function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-14 rounded-2xl" : "size-9 rounded-xl";
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 bg-accent place-items-center text-accent-fg ${box}`}
    >
      <Scissors size={size === "lg" ? 24 : 17} strokeWidth={2.25} />
    </span>
  );
}
