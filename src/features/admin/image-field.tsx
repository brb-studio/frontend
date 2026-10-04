"use client";

import { Camera, ImageIcon } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, useId, useState, useTransition } from "react";
import { uploadImage } from "./actions";
import type { AdminText } from "./ui";

const MAX_SIDE = 1600;
// Under the server action's 1 MB body limit, multipart overhead included.
const MAX_BYTES = 900 * 1024;

/**
 * Re-encodes any photo the browser can open (iPhone HEIC included) as a JPEG of at most 1600 px and
 * 900 KB. Re-encoding also drops EXIF metadata such as GPS location.
 */
async function shrink(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no canvas");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.85, 0.72, 0.6, 0.45]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (blob && blob.size <= MAX_BYTES) return blob;
  }
  throw new Error("too big");
}

/** A photo picker for a form: uploads right away and keeps the stored path in a hidden input. */
export function ImageField({
  name = "image",
  label,
  defaultValue,
  t,
}: {
  name?: string;
  label: string;
  defaultValue?: string;
  t: AdminText["images"];
}) {
  const id = useId();
  const [path, setPath] = useState(defaultValue ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    startTransition(async () => {
      try {
        const form = new FormData();
        form.set(
          "file",
          new File([await shrink(file)], "photo.jpg", { type: "image/jpeg" }),
        );
        const result = await uploadImage(form);
        if (result.ok) setPath(result.path);
        else setError(result.code === "IMAGE_LIMIT" ? t.limit : t.failed);
      } catch {
        setError(t.unreadable);
      }
    });
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-4">
        <span className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-surface text-fg-muted">
          {path ? (
            <Image
              src={path}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <ImageIcon size={24} aria-hidden="true" />
          )}
        </span>
        <label
          htmlFor={id}
          aria-disabled={pending}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-line px-4 text-sm transition-colors hover:border-accent-text has-focus-visible:outline-2 has-focus-visible:outline-accent-text aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          <Camera size={16} aria-hidden="true" />
          {pending ? t.uploading : path ? t.change : t.upload}
          <input
            id={id}
            type="file"
            accept="image/*"
            onChange={pick}
            disabled={pending}
            className="sr-only"
          />
        </label>
      </div>
      <input type="hidden" name={name} value={path} />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
