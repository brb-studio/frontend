import { describe, expect, test } from "bun:test";
import { apiQuery, levelOf } from "./model";

const base = { from: "2026-10-01", to: "2026-10-09" };
const id = "6ac9941c110a7435c068b0b4";

describe("platform dashboard filters", () => {
  test("the level follows the deepest filter chosen", () => {
    expect(levelOf(base)).toBe("overview");
    expect(levelOf({ ...base, tenant: id })).toBe("tenant");
    expect(levelOf({ ...base, tenant: id, branch: id })).toBe("branch");
    expect(levelOf({ ...base, tenant: id, branch: id, barber: id })).toBe(
      "barber",
    );
  });

  test("the API query carries only what is set, with the API's names", () => {
    expect(apiQuery(base)).toBe("from=2026-10-01&to=2026-10-09");
    expect(
      apiQuery(
        { ...base, tenant: id, status: "completed" },
        { page: 2, limit: 25 },
      ),
    ).toBe(
      `from=2026-10-01&to=2026-10-09&tenantId=${id}&status=completed&page=2&limit=25`,
    );
  });
});
