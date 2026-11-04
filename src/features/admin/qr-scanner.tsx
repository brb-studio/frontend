"use client";

import jsQR from "jsqr";
import { Flashlight, FlashlightOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Frames are decoded at this width: enough for a phone's QR at counter distance, cheap to scan. */
const MAX_WIDTH = 480;
/** About 8 reads a second instead of one per frame (60): the same speed to the eye, a fraction of the battery. */
const READ_EVERY_MS = 120;

type Torch = MediaTrackConstraintSet & { torch?: boolean };

/**
 * Reads a QR with the phone's rear camera. Decoding runs in the page (`jsqr`), because Safari on iPhone has
 * no `BarcodeDetector`. It stops at the first code, buzzes when the phone can, and releases the camera when
 * it closes. Where the camera has a flashlight (most Android phones), a button turns it on.
 */
export function QrScanner({
  onCode,
  denied,
  unsupported,
  hint,
  torchOn,
  torchOff,
}: {
  onCode: (code: string) => void;
  denied: string;
  unsupported: string;
  /** Shown over the camera: what to do. */
  hint: string;
  torchOn: string;
  torchOff: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const track = useRef<MediaStreamTrack | null>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const [problem, setProblem] = useState<"denied" | "unsupported" | null>(null);
  const [torch, setTorch] = useState<"none" | "off" | "on">("none");

  useEffect(() => {
    let stopped = false;
    let frame = 0;
    let last = 0;
    let stream: MediaStream | undefined;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia || !context) {
        setProblem("unsupported");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 } },
          audio: false,
        });
      } catch {
        setProblem("denied");
        return;
      }
      const element = video.current;
      if (stopped || !element) {
        for (const t of stream.getTracks()) t.stop();
        return;
      }
      element.srcObject = stream;
      await element.play().catch(() => undefined);
      // On a phone the camera opens below the fold: bring it into view.
      box.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      const [videoTrack] = stream.getVideoTracks();
      track.current = videoTrack ?? null;
      const capabilities = videoTrack?.getCapabilities?.() as
        | (MediaTrackCapabilities & { torch?: boolean })
        | undefined;
      if (capabilities?.torch) setTorch("off");

      const look = (time: number) => {
        if (stopped || !context) return;
        if (
          time - last >= READ_EVERY_MS &&
          element.readyState === element.HAVE_ENOUGH_DATA
        ) {
          last = time;
          const scale = Math.min(1, MAX_WIDTH / element.videoWidth);
          canvas.width = Math.round(element.videoWidth * scale);
          canvas.height = Math.round(element.videoHeight * scale);
          context.drawImage(element, 0, 0, canvas.width, canvas.height);
          const { data, width, height } = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );
          const found = jsQR(data, width, height, {
            inversionAttempts: "dontInvert",
          });
          if (found?.data) {
            navigator.vibrate?.(60);
            onCodeRef.current(found.data);
            return;
          }
        }
        frame = requestAnimationFrame(look);
      };
      frame = requestAnimationFrame(look);
    }
    void start();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      track.current = null;
      for (const t of stream?.getTracks() ?? []) t.stop();
    };
  }, []);

  async function flip() {
    const next = torch !== "on";
    try {
      await track.current?.applyConstraints({
        advanced: [{ torch: next } as Torch],
      });
      setTorch(next ? "on" : "off");
    } catch {
      setTorch("none");
    }
  }

  if (problem) {
    return (
      <p role="alert" className="text-sm text-danger">
        {problem === "denied" ? denied : unsupported}
      </p>
    );
  }
  return (
    <div
      ref={box}
      className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl border border-line bg-black"
    >
      <video
        ref={video}
        playsInline
        muted
        className="absolute inset-0 size-full object-cover"
      />
      {/* A square guide in the middle, and the corners that tell where to put the code. */}
      <div aria-hidden="true" className="absolute inset-[18%]">
        <span className="absolute top-0 left-0 size-8 rounded-tl-2xl border-t-4 border-l-4 border-white" />
        <span className="absolute top-0 right-0 size-8 rounded-tr-2xl border-t-4 border-r-4 border-white" />
        <span className="absolute bottom-0 left-0 size-8 rounded-bl-2xl border-b-4 border-l-4 border-white" />
        <span className="absolute right-0 bottom-0 size-8 rounded-br-2xl border-r-4 border-b-4 border-white" />
        <span className="absolute inset-x-2 top-1/2 h-0.5 animate-pulse bg-accent/80" />
      </div>
      <p className="absolute inset-x-0 bottom-0 bg-black/55 px-4 py-2.5 text-center text-sm text-white">
        {hint}
      </p>
      {torch !== "none" && (
        <button
          type="button"
          aria-pressed={torch === "on"}
          aria-label={torch === "on" ? torchOff : torchOn}
          title={torch === "on" ? torchOff : torchOn}
          onClick={() => void flip()}
          className="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-black/55 text-white"
        >
          {torch === "on" ? (
            <FlashlightOff size={20} aria-hidden="true" />
          ) : (
            <Flashlight size={20} aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}
