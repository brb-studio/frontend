import { expect, test } from "bun:test";
import { initials } from "./initials";

test("two initials from the first two words, accents kept", () => {
  expect(initials("Ana López")).toBe("AL");
  expect(initials("  Ángel   ruiz  pérez ")).toBe("ÁR");
  expect(initials("Mateo")).toBe("M");
});

test("words without letters are skipped; an empty name still shows something", () => {
  expect(initials("Don Ramón (sin cuenta)")).toBe("DR");
  expect(initials("+52 664 000")).toBe("?");
  expect(initials("")).toBe("?");
});
