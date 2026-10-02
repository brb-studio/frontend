import Link from "next/link";
import type { ComponentProps } from "react";

const base =
  "inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-medium transition-[box-shadow,filter,transform,border-color,background-color] duration-200 ease-out-expo active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary: "bg-accent text-accent-fg hover:shadow-glow",
  secondary: "glass text-fg hover:border-accent-text",
  onImage:
    "border border-white/20 bg-white/15 text-white backdrop-blur-xl hover:bg-white/25",
};

type Variant = keyof typeof variants;

export const buttonClass = (variant: Variant = "primary", className = "") =>
  `${base} ${variants[variant]} ${className}`;
const classes = buttonClass;

export function Button({
  variant = "primary",
  type = "button",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button type={type} className={classes(variant, className)} {...props} />
  );
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={classes(variant, className)} {...props} />;
}
