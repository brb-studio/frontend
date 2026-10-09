"use client";

import { Camera, Star, X } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, useId, useState, useTransition } from "react";
import { uploadImage } from "./actions";
import type { AdminText } from "./ui";

const MAX_SIDE = 1600;
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

const MAX_PHOTOS = 12;

/**
 * A gallery for a form, cover first: pick several photos at once, remove any, promote one to cover.
 * Each photo uploads as soon as it's picked; the form posts the ordered paths as `images`.
 */
export function ImagesField({
  label,
  defaultValue = [],
  t,
}: {
  label: string;
  defaultValue?: string[];
  t: AdminText["images"];
}) {
  const id = useId();
  const [paths, setPaths] = useState(defaultValue);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function add(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(
      0,
      MAX_PHOTOS - paths.length,
    );
    event.target.value = "";
    if (files.length === 0) return;
    setError("");
    startTransition(async () => {
      // One at a time, in the order picked: the gallery keeps that order and uploads never pile up.
      for (const file of files) {
        try {
          const form = new FormData();
          form.set(
            "file",
            new File([await shrink(file)], "photo.jpg", { type: "image/jpeg" }),
          );
          const result = await uploadImage(form);
          if (!result.ok) {
            setError(result.code === "IMAGE_LIMIT" ? t.limit : t.failed);
            return;
          }
          setPaths((list) => [...list, result.path]);
        } catch {
          setError(t.unreadable);
          return;
        }
      }
    });
  }
  const remove = (path: string) =>
    setPaths((list) => list.filter((p) => p !== path));
  const cover = (path: string) =>
    setPaths((list) => [path, ...list.filter((p) => p !== path)]);
  const badge =
    "absolute top-1.5 grid size-8 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80";

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {paths.map((path, index) => (
          <li
            key={path}
            className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface"
          >
            <Image
              src={path}
              alt=""
              fill
              sizes="160px"
              className="object-cover"
            />
            {index === 0 ? (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-accent px-2 py-1 text-[0.6875rem] font-medium text-accent-fg">
                {t.cover}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => cover(path)}
                aria-label={`${t.makeCover} (${index + 1})`}
                className={`${badge} left-1.5`}
              >
                <Star size={14} aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(path)}
              aria-label={`${t.remove} (${index + 1})`}
              className={`${badge} right-1.5`}
            >
              <X size={14} aria-hidden="true" />
            </button>
            <input type="hidden" name="images" value={path} />
          </li>
        ))}
        {paths.length < MAX_PHOTOS && (
          <li>
            <label
              htmlFor={id}
              aria-disabled={pending}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line-strong px-2 text-center text-xs text-fg-muted transition-colors hover:border-accent-text hover:text-fg has-focus-visible:outline-2 has-focus-visible:outline-accent-text aria-disabled:pointer-events-none aria-disabled:opacity-60"
            >
              <Camera size={22} aria-hidden="true" />
              {pending ? t.uploading : t.add}
              <input
                id={id}
                type="file"
                accept="image/*"
                multiple
                onChange={add}
                disabled={pending}
                className="sr-only"
              />
            </label>
          </li>
        )}
      </ul>
      <p className="text-xs text-fg-muted">{t.hint}</p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
