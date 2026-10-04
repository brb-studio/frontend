"use server";

import * as z from "zod";
import { backend } from "@/shared/api/backend";

type Result = { ok: boolean };

export async function markAllRead(): Promise<Result> {
  try {
    await backend("/v1/notifications/read", z.undefined(), {
      method: "POST",
      body: {},
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** What `PushSubscription.toJSON()` gives in the browser; the API re-checks the endpoint's host. */
const subscription = z.object({
  endpoint: z.url({ protocol: /^https$/ }).max(2048),
  keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(50) }),
});

export async function savePushSubscription(input: unknown): Promise<Result> {
  const parsed = subscription.safeParse(input);
  if (!parsed.success) return { ok: false };
  try {
    await backend("/v1/notifications/push-subscriptions", z.undefined(), {
      method: "POST",
      body: { endpoint: parsed.data.endpoint, keys: parsed.data.keys },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function removePushSubscription(
  endpoint: string,
): Promise<Result> {
  const parsed = subscription.shape.endpoint.safeParse(endpoint);
  if (!parsed.success) return { ok: false };
  try {
    await backend("/v1/notifications/push-subscriptions", z.undefined(), {
      method: "DELETE",
      body: { endpoint: parsed.data },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
