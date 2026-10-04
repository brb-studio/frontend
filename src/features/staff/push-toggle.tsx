"use client";

import { BellOff, BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import { Button } from "@/shared/ui/button";
import { removePushSubscription, savePushSubscription } from "./actions";

type State = "loading" | "unsupported" | "install" | "blocked" | "off" | "on";

/** VAPID keys travel as base64url; the Push API wants raw bytes. */
function keyBytes(base64url: string) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

/**
 * Phone notifications for new, moved and cancelled appointments (Web Push). Android works in the
 * browser; an iPhone needs the app added to the home screen first (iOS 16.4+), so we say so.
 */
export function PushToggle({
  publicKey,
  t,
}: {
  publicKey: string;
  t: Dictionary["account"]["push"];
}) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const installed = window.matchMedia("(display-mode: standalone)").matches;
    if (
      !(
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
      )
    ) {
      setState(ios && !installed ? "install" : "unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("blocked");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setState(subscription ? "on" : "off"))
      .catch(() => setState("unsupported"));
  }, []);

  async function enable() {
    setBusy(true);
    setFailed(false);
    try {
      // Must run inside the tap: browsers only show the permission prompt for a user gesture.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes(publicKey),
      });
      const saved = await savePushSubscription(subscription.toJSON());
      if (!saved.ok) {
        await subscription.unsubscribe();
        setFailed(true);
        return;
      }
      setState("on");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return null;
  const note = (text: string) => (
    <p className="text-sm text-fg-muted">{text}</p>
  );

  return (
    <div className="grid gap-3 rounded-3xl border border-line bg-card p-5">
      {state === "unsupported" && note(t.unsupported)}
      {state === "install" && note(t.installIos)}
      {state === "blocked" && note(t.blocked)}
      {state === "off" && (
        <Button onClick={() => void enable()} disabled={busy}>
          <BellRing size={18} aria-hidden="true" />
          {t.enable}
        </Button>
      )}
      {state === "on" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm">
            <BellRing
              size={18}
              aria-hidden="true"
              className="text-accent-text"
            />
            {t.on}
          </p>
          <Button
            variant="secondary"
            onClick={() => void disable()}
            disabled={busy}
          >
            <BellOff size={18} aria-hidden="true" />
            {t.off}
          </Button>
        </div>
      )}
      {failed && (
        <p role="alert" className="text-sm text-danger">
          {t.failed}
        </p>
      )}
    </div>
  );
}
