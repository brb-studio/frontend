import { ArrowUpRight, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Service } from "./api";

type Props = {
  service: Service;
  href: string;
  price: string;
  minutesLabel: string;
  sizes: string;
  heading?: "h2" | "h3";
  className?: string;
};

export function ServiceCard({
  service,
  href,
  price,
  minutesLabel,
  sizes,
  heading: Heading = "h3",
  className = "",
}: Props) {
  return (
    <li
      className={`group relative grid content-start gap-3 rounded-[1.75rem] border border-line bg-card p-2 pb-4 shadow-soft has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-3 has-[a:focus-visible]:outline-accent-text ${className}`}
    >
      <div className="relative isolate aspect-square overflow-hidden rounded-[1.375rem] bg-canvas">
        <Image
          src={service.image}
          alt=""
          fill
          sizes={sizes}
          className="-z-10 object-cover transition-transform duration-700 ease-out-expo group-has-[a:hover]:scale-105"
        />
        <p className="absolute left-2 top-2 flex items-center gap-1 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-xs text-white backdrop-blur-md">
          <Clock size={12} aria-hidden="true" />
          {service.durationMin} {minutesLabel}
        </p>
      </div>
      <div className="grid gap-1 px-2">
        <Heading className="text-base font-medium leading-tight sm:text-lg">
          <Link
            href={href}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {service.name}
          </Link>
        </Heading>
        <p className="hidden text-sm text-fg-muted sm:line-clamp-2">
          {service.description}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-lg font-semibold">{price}</span>
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-accent-fg transition-transform duration-500 ease-out-expo group-has-[a:hover]:rotate-45 max-[22.5rem]:hidden"
          >
            <ArrowUpRight size={18} />
          </span>
        </div>
      </div>
    </li>
  );
}
