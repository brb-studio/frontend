import { afterAll, beforeAll, expect, test } from "bun:test";
import {
  getRedirectUrl,
  getRewrittenUrl,
  isRewrite,
} from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { proxy, SITE_REWRITE_HEADER } from "./proxy";

const before = process.env.MARKETING_HOSTS;
beforeAll(() => {
  process.env.MARKETING_HOSTS = "www.localhost";
});
afterAll(() => {
  if (before === undefined) delete process.env.MARKETING_HOSTS;
  else process.env.MARKETING_HOSTS = before;
});

const call = (url: string, headers: Record<string, string> = {}) => {
  const host = new URL(url).host;
  // The test DOM drops the forbidden `host` header; the forwarded host takes precedence anyway.
  return proxy(
    new NextRequest(url, { headers: { "x-forwarded-host": host, ...headers } }),
  );
};

test("a marketing host serves /{lang}/… from the marketing tree, URL unchanged", () => {
  const home = call("http://www.localhost:3000/es");
  expect(home && isRewrite(home)).toBe(true);
  expect(home && getRewrittenUrl(home)).toBe(
    "http://www.localhost:3000/site/es",
  );
  const privacy = call("http://www.localhost:3000/en/privacy?x=1");
  expect(privacy && getRewrittenUrl(privacy)).toBe(
    "http://www.localhost:3000/site/en/privacy?x=1",
  );
});

test("the root still redirects to the visitor's language first", () => {
  const res = call("http://www.localhost:3000/", {
    "accept-language": "en-US",
  });
  expect(res && getRedirectUrl(res)).toBe("http://www.localhost:3000/en");
  expect(res?.headers.get("Vary")).toBe("Accept-Language");
});

test("tenant hosts and IPs never see the marketing tree", () => {
  expect(call("http://localhost:3000/es")).toBeUndefined();
  expect(call("http://127.0.0.1:3200/es")).toBeUndefined();
  expect(call("http://montecobre.localhost:3000/es")).toBeUndefined();
  expect(call("http://localhost:3000/site/es")?.status).toBe(404);
  expect(call("http://127.0.0.1:3200/site/en/privacy")?.status).toBe(404);
  expect(call("http://localhost:3000/site/es/opengraph-image")?.status).toBe(
    404,
  );
});

test("on the marketing host the physical /site path is hidden, except its OG image", () => {
  expect(call("http://www.localhost:3000/site/es")?.status).toBe(404);
  expect(
    call("http://www.localhost:3000/site/es/opengraph-image-1x2y3z"),
  ).toBeUndefined();
});

test("our own rewrite may reach /site when Next replays it as an external hop", () => {
  const rewrite = call("http://www.localhost:3000/es");
  const token = rewrite?.headers.get(
    `x-middleware-request-${SITE_REWRITE_HEADER}`,
  );
  expect(token).toBeTruthy();
  expect(
    call("http://www.localhost:3000/site/es", {
      [SITE_REWRITE_HEADER]: token ?? "",
    }),
  ).toBeUndefined();
  expect(
    call("http://www.localhost:3000/site/es", {
      [SITE_REWRITE_HEADER]: "guess",
    })?.status,
  ).toBe(404);
  expect(
    call("http://localhost:3000/site/es", {
      [SITE_REWRITE_HEADER]: token ?? "",
    })?.status,
  ).toBe(404);
});
