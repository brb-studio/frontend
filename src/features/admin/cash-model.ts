export type Tone = "in" | "out" | "adjust";

const DAY = 864e5;

export const shiftDay = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY)
    .toISOString()
    .slice(0, 10);

export const toneOf = (entry: {
  direction: "in" | "out";
  type: string;
}): Tone => (entry.type === "adjustment" ? "adjust" : entry.direction);

export const signed = (direction: "in" | "out", text: string) =>
  `${direction === "in" ? "+" : "−"}${text}`;
