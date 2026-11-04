/** At this many units or fewer a counted product shows as running low. */
export const LOW_STOCK = 3;

export type StockState = "out" | "low" | "ok";

export const stockState = (quantity: number): StockState =>
  quantity <= 0 ? "out" : quantity <= LOW_STOCK ? "low" : "ok";

type Counted = { active: boolean; stock: { quantity: number }[] };

/** How many active products are out or running low somewhere (each product counted once, at its worst). */
export function stockAlerts(products: Counted[]) {
  let out = 0;
  let low = 0;
  for (const p of products) {
    if (!p.active || p.stock.length === 0) continue;
    const states = p.stock.map((s) => stockState(s.quantity));
    if (states.includes("out")) out += 1;
    else if (states.includes("low")) low += 1;
  }
  return { out, low };
}

/** The categories in use, once each, alphabetically (accents and case kept as typed the first time). */
export function categoriesOf(products: { category?: string | undefined }[]) {
  const seen = new Map<string, string>();
  for (const p of products) {
    const name = p.category?.trim();
    if (name && !seen.has(name.toLocaleLowerCase()))
      seen.set(name.toLocaleLowerCase(), name);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export const inCategory = (
  product: { category?: string | undefined },
  category: string,
) =>
  category === "" ||
  product.category?.trim().toLocaleLowerCase() === category.toLocaleLowerCase();

/** A typed stock box: empty means "not counted" (null), otherwise a whole number of units. */
export function parseStock(text: string) {
  const digits = text.replace(/\D/g, "");
  return digits === "" ? null : Math.min(100_000, Number(digits));
}

/** Only the branches whose count changed, ready for `PUT …/stock/:branchId`. */
export function stockChanges(
  before: { branchId: string; quantity: number }[],
  after: Record<string, number | null>,
) {
  const counts = new Map(before.map((s) => [s.branchId, s.quantity]));
  return Object.entries(after).flatMap(([branchId, quantity]) =>
    quantity === (counts.get(branchId) ?? null) ? [] : [{ branchId, quantity }],
  );
}
