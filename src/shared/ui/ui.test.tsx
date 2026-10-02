import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";
import { Field } from "./field";

test("Button defaults to type=button so it never submits a form by accident", () => {
  render(<Button>Save</Button>);
  expect(
    screen.getByRole("button", { name: "Save" }).getAttribute("type"),
  ).toBe("button");
});

test("Button keeps an explicit submit type", () => {
  render(<Button type="submit">Book</Button>);
  expect(
    screen.getByRole("button", { name: "Book" }).getAttribute("type"),
  ).toBe("submit");
});

test("Field wires label, hint and error to the input", () => {
  render(
    <Field
      name="phone"
      label="Phone"
      hint="We text your confirmation"
      error="Enter a valid number"
    />,
  );
  const input = screen.getByLabelText("Phone");
  expect(input.getAttribute("aria-invalid")).toBe("true");
  const described = (input.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .map((id) => document.getElementById(id)?.textContent);
  expect(described).toEqual([
    "We text your confirmation",
    "Enter a valid number",
  ]);
});

test("Field without hint or error has no invalid flag or dangling description", () => {
  render(<Field name="name" label="Name" />);
  const input = screen.getByLabelText("Name");
  expect(input.hasAttribute("aria-invalid")).toBe(false);
  expect(input.hasAttribute("aria-describedby")).toBe(false);
});
