import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getDictionary } from "@/shared/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: dict.platform.title,
    robots: { index: false, follow: false },
  };
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return children;
}
