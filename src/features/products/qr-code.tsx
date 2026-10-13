import { encode } from "uqr";

/** A QR in black on white at any theme (scanners need the contrast), drawn as one SVG path. */
export function QrCode({ value, label }: { value: string; label: string }) {
  const { data, size } = encode(value, { ecc: "M", border: 2 });
  const squares = data
    .flatMap((row, y) =>
      row.map((dark, x) => (dark ? `M${x} ${y}h1v1h-1z` : "")),
    )
    .join("");
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      className="size-56 max-w-full rounded-2xl bg-white"
    >
      <path d={squares} fill="#000" />
    </svg>
  );
}
