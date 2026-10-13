"use client";

import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";

const MAX_WIDTH = 480;

/**
 * Reads a QR with the phone's rear camera. Decoding runs in the page (`jsqr`), because Safari on iPhone has
 * no `BarcodeDetector`. It stops at the first code and releases the camera when it closes.
 */
export function QrScanner({
  onCode,
  denied,
  unsupported,
}: {
  onCode: (code: string) => void;
  denied: string;
  unsupported: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const [problem, setProblem] = useState<"denied" | "unsupported" | null>(null);

  useEffect(() => {
    let stopped = false;
    let frame = 0;
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
          video: { facingMode: "environment" },
        });
      } catch {
        setProblem("denied");
        return;
      }
      const element = video.current;
      if (stopped || !element) {
        for (const track of stream.getTracks()) track.stop();
        return;
      }
      element.srcObject = stream;
      await element.play().catch(() => undefined);

      const look = () => {
        if (stopped || !context) return;
        if (element.readyState === element.HAVE_ENOUGH_DATA) {
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
            onCodeRef.current(found.data);
            return;
          }
        }
        frame = requestAnimationFrame(look);
      };
      look();
    }
    void start();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      for (const track of stream?.getTracks() ?? []) track.stop();
    };
  }, []);

  if (problem) {
    return (
      <p role="alert" className="text-sm text-danger">
        {problem === "denied" ? denied : unsupported}
      </p>
    );
  }
  return (
    <video
      ref={video}
      playsInline
      muted
      className="aspect-square w-full max-w-sm rounded-3xl border border-line bg-black object-cover"
    />
  );
}
