import { expect, test } from "bun:test";
import { tenantHostOf, visitorIp } from "./backend";

test("the visitor IP is the entry our own proxies wrote, not what the client typed", () => {
  // Local dev: no proxy, Next sets the socket address.
  expect(visitorIp("::1", 1)).toBe("::1");
  // One proxy appended the real address after a forged one.
  expect(visitorIp("6.6.6.6, 203.0.113.7", 1)).toBe("203.0.113.7");
  // CDN + load balancer: the CDN saw the visitor, the balancer saw the CDN.
  expect(visitorIp("6.6.6.6, 203.0.113.7, 10.0.0.2", 2)).toBe("203.0.113.7");
  // Fewer entries than hops, garbage and a broken setting never throw.
  expect(visitorIp("203.0.113.7", 3)).toBe("203.0.113.7");
  expect(visitorIp("not an ip", 1)).toBeUndefined();
  expect(visitorIp(null, 1)).toBeUndefined();
  expect(visitorIp("1.1.1.1, 2.2.2.2", Number.NaN)).toBe("2.2.2.2");
});

test("a host without a tenant in it falls back to DEFAULT_TENANT_HOST; tenant subdomains stay as they are", () => {
  const of = (host: string) => tenantHostOf(new Headers({ host }));
  process.env.DEFAULT_TENANT_HOST = "magicstudio.localhost";
  expect(of("localhost:3000")).toBe("magicstudio.localhost");
  expect(of("192.168.1.79:3000")).toBe("magicstudio.localhost");
  expect(of("[::1]:3000")).toBe("magicstudio.localhost");
  expect(of("elite.localhost:3000")).toBe("elite.localhost:3000");
  expect(of("barberia.example.com")).toBe("barberia.example.com");
  delete process.env.DEFAULT_TENANT_HOST;
  expect(of("localhost:3000")).toBe("localhost:3000");
});
