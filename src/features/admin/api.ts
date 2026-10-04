"use client";

import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type * as z from "zod";
import { type AdminResult, adminRequest } from "./actions";

/** A staff resource read through /api/admin, validated against its schema. */
export const adminQuery = <S extends z.ZodType>(path: string, schema: S) =>
  queryOptions({
    queryKey: ["admin", path],
    queryFn: async ({ signal }): Promise<z.output<S>> => {
      const response = await fetch(`/api/admin/${path}`, { signal });
      if (!response.ok) throw new Error(`${path} ${response.status}`);
      return schema.parse(await response.json());
    },
    staleTime: 15_000,
  });

/** An admin write; on success every admin query refetches, so lists never show stale rows. */
export function useAdminAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminRequest,
    onSuccess: (result: AdminResult) => {
      if (result.ok)
        void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}
