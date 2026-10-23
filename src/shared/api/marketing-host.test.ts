import { expect, test } from "bun:test";
import {
  isMarketingHost,
  mailtoHref,
  marketingContact,
  marketingUrl,
  requestHostOf,
  whatsappHref,
} from "./marketing-host";

test("only listed hosts are the marketing site, with or without a port", () => {
  const list = "brbstudio.com, www.brbstudio.com,www.localhost";
  expect(isMarketingHost("brbstudio.com", list)).toBe(true);
  expect(isMarketingHost("WWW.BrbStudio.com.", list)).toBe(true);
  expect(isMarketingHost("www.localhost:3000", list)).toBe(true);
  expect(isMarketingHost("montecobre.brbstudio.com", list)).toBe(false);
  expect(isMarketingHost("localhost:3000", list)).toBe(false);
  expect(isMarketingHost("evilbrbstudio.com", list)).toBe(false);
  expect(isMarketingHost("", list)).toBe(false);
  expect(isMarketingHost(null, list)).toBe(false);
});

test("IP hosts never match, so CI on 127.0.0.1 keeps the default tenant", () => {
  const list = "localhost,127.0.0.1,[::1]";
  expect(isMarketingHost("127.0.0.1:3200", list)).toBe(false);
  expect(isMarketingHost("127.0.0.1", list)).toBe(false);
  expect(isMarketingHost("[::1]:3200", list)).toBe(false);
  expect(isMarketingHost("192.168.1.79:3000", list)).toBe(false);
  expect(isMarketingHost("localhost:3200", list)).toBe(true);
});

test("an entry with a port only matches that port", () => {
  expect(isMarketingHost("localhost:3200", "localhost:3200")).toBe(true);
  expect(isMarketingHost("localhost:3000", "localhost:3200")).toBe(false);
  expect(isMarketingHost("localhost", "localhost:3200")).toBe(false);
});

test("nothing is the marketing site when MARKETING_HOSTS is empty", () => {
  expect(isMarketingHost("www.localhost:3000", "")).toBe(false);
  expect(isMarketingHost("www.localhost:3000", undefined)).toBe(false);
});

test("the request host prefers the forwarded host, like tenantHostOf", () => {
  expect(
    requestHostOf(
      new Headers({ host: "a.test", "x-forwarded-host": "www.b.test" }),
    ),
  ).toBe("www.b.test");
  expect(requestHostOf(new Headers({ host: "a.test" }))).toBe("a.test");
});

test("contact channels come from env and are dropped when malformed", () => {
  expect(
    marketingContact({
      MARKETING_WHATSAPP: "+52 55 1234 5678",
      MARKETING_EMAIL: "hola@brbstudio.com",
      MARKETING_SHOWCASE_URL: "https://montecobre.brbstudio.com",
    }),
  ).toEqual({
    whatsapp: "525512345678",
    email: "hola@brbstudio.com",
    showcaseUrl: "https://montecobre.brbstudio.com",
  });
  expect(
    marketingContact({
      MARKETING_WHATSAPP: "123",
      MARKETING_EMAIL: "not an email",
      MARKETING_SHOWCASE_URL: "javascript:alert(1)",
    }),
  ).toEqual({ whatsapp: undefined, email: undefined, showcaseUrl: undefined });
  expect(marketingContact({})).toEqual({
    whatsapp: undefined,
    email: undefined,
    showcaseUrl: undefined,
  });
});

test("CTA links are encoded", () => {
  expect(whatsappHref("525512345678", "Hola, ¿qué tal?")).toBe(
    "https://wa.me/525512345678?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F",
  );
  expect(mailtoHref("a@b.co", "Demo & más", "x")).toBe(
    "mailto:a@b.co?subject=Demo%20%26%20m%C3%A1s&body=x",
  );
});

test("a production build refuses MARKETING_HOSTS without MARKETING_URL", () => {
  expect(() =>
    marketingUrl({ NODE_ENV: "production", MARKETING_HOSTS: "brbstudio.com" }),
  ).toThrow("MARKETING_URL");
  expect(marketingUrl({ MARKETING_URL: "https://brbstudio.com" }).origin).toBe(
    "https://brbstudio.com",
  );
  expect(marketingUrl({}).origin).toBe("http://www.localhost:3000");
});
