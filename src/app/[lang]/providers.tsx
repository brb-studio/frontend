"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const make = () =>
  new QueryClient({
    defaultOptions: {
      // One quick retry for a flaky network; never hammer a failing API.
      queries: { retry: 1 },
      mutations: { retry: false },
    },
  });

let browserQueryClient: QueryClient | undefined;

/** A fresh client per server render (requests never share data); one client for the browser's life. */
function getQueryClient() {
  if (typeof window === "undefined") return make();
  browserQueryClient ??= make();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}
