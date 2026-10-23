import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { LegalHeader, LegalList, LegalSection } from "./legal";

test("a legal page has one h1, h2 sections and plain lists", () => {
  render(
    <article>
      <LegalHeader title="Aviso de privacidad" updated="23 de octubre" />
      <LegalSection title="Qué datos usamos">
        <LegalList items={["Nombre", "Correo"]} />
      </LegalSection>
    </article>,
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "Aviso de privacidad" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("heading", { level: 2, name: "Qué datos usamos" }),
  ).toBeTruthy();
  expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
    "Nombre",
    "Correo",
  ]);
});
