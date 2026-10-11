"use client";

import { Check, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { AdminText } from "./ui";

export const DEFAULT_LIGHT = "#ffffff";
export const DEFAULT_DARK = "#050505";
const DEFAULT_ACCENT = "#ff6a1a";
const HEX = /^#[0-9a-f]{6}$/i;

const ACCENTS = [
  "#ff6a1a",
  "#e5484d",
  "#d6a419",
  "#2f9e6f",
  "#2f80ed",
  "#7c5cff",
];
const LIGHTS = ["#ffffff", "#f6f3ec", "#efefed", "#e4e4e1", "#f3ebe2"];
const DARKS = ["#050505", "#0d0f12", "#16181d", "#1f1d1b", "#0b1220"];

/** The saved page background for a scheme, or the built-in default (also for non-#rrggbb values). */
function savedCanvas(canvas: unknown, scheme: "light" | "dark") {
  const fallback = scheme === "light" ? DEFAULT_LIGHT : DEFAULT_DARK;
  const color =
    typeof canvas === "string"
      ? canvas
      : (canvas as Record<string, unknown> | undefined)?.[scheme];
  return typeof color === "string" && HEX.test(color) ? color : fallback;
}

type Preview = { text: string; accent: string };

function ColorField({
  name,
  label,
  value,
  onChange,
  presets,
  preview,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (color: string) => void;
  presets: string[];
  preview?: Preview;
}) {
  return (
    <div className="grid gap-3 rounded-3xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <code className="rounded-full border border-line px-2.5 py-0.5 text-xs uppercase text-fg-muted">
          {value}
        </code>
      </div>
      <label className="group relative block h-24 cursor-pointer overflow-hidden rounded-2xl border border-line-strong transition-shadow focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent hover:shadow-soft">
        <input
          type="color"
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          aria-label={label}
        />
        <span
          aria-hidden="true"
          className="flex size-full items-end justify-between p-3"
          style={{ backgroundColor: value }}
        >
          {preview ? (
            <>
              <span
                className="text-2xl font-medium"
                style={{ color: preview.text }}
              >
                Aa
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-medium text-[#111]"
                style={{ backgroundColor: preview.accent }}
              >
                ●
              </span>
            </>
          ) : (
            <span className="rounded-full bg-black/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              {value.toUpperCase()}
            </span>
          )}
        </span>
      </label>
      <fieldset
        aria-label={label}
        className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0"
      >
        {presets.map((color) => {
          const selected = color.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              aria-label={color}
              aria-pressed={selected}
              onClick={() => onChange(color)}
              style={{ backgroundColor: color }}
              className={`grid size-9 place-items-center rounded-full border transition-transform hover:scale-110 ${selected ? "border-fg ring-2 ring-accent" : "border-line-strong"}`}
            >
              {selected && (
                <Check
                  size={14}
                  aria-hidden="true"
                  className="mix-blend-difference text-white"
                />
              )}
            </button>
          );
        })}
      </fieldset>
    </div>
  );
}

/** Accent plus light and dark page backgrounds: swatch preview, ready-made colors and a free picker. */
export function ThemeFields({
  t,
  accent,
  canvas,
}: {
  t: AdminText["settings"];
  accent: unknown;
  canvas: unknown;
}) {
  const [accentColor, setAccent] = useState(
    typeof accent === "string" && HEX.test(accent) ? accent : DEFAULT_ACCENT,
  );
  const [light, setLight] = useState(savedCanvas(canvas, "light"));
  const [dark, setDark] = useState(savedCanvas(canvas, "dark"));
  const atDefault = light === DEFAULT_LIGHT && dark === DEFAULT_DARK;

  return (
    <div className="grid gap-3">
      <ColorField
        name="accent"
        label={t.accent}
        value={accentColor}
        onChange={setAccent}
        presets={ACCENTS}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <ColorField
          name="canvasLight"
          label={t.backgroundLight}
          value={light}
          onChange={setLight}
          presets={LIGHTS}
          preview={{ text: "#111111", accent: accentColor }}
        />
        <ColorField
          name="canvasDark"
          label={t.backgroundDark}
          value={dark}
          onChange={setDark}
          presets={DARKS}
          preview={{ text: "#f5f5f4", accent: accentColor }}
        />
      </div>
      <button
        type="button"
        disabled={atDefault}
        onClick={() => {
          setLight(DEFAULT_LIGHT);
          setDark(DEFAULT_DARK);
        }}
        className="flex h-10 w-fit items-center gap-2 rounded-full border border-line px-4 text-sm text-fg-muted transition-colors hover:border-accent disabled:opacity-40"
      >
        <RotateCcw size={16} aria-hidden="true" />
        {t.backgroundReset}
      </button>
    </div>
  );
}
