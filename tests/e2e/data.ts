import type { Localized } from "../../src/shared/i18n/localized";

export const API_PORT = 4100;
export const TENANT_HOST = "magicstudio.localhost";
export const CUSTOMER = {
  email: "cliente@magicstudio.test",
  password: "demo1234",
};

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`http://127.0.0.1:${API_PORT}${path}`, {
    headers: { "X-Tenant-Host": TENANT_HOST },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return (await res.json()) as T;
}

export const getTenant = () =>
  get<{
    currency: string;
    branches: {
      slug: string;
      name: string;
      address: string[];
      phone?: string;
    }[];
  }>("/v1/public/tenant");

export const getCatalog = () =>
  get<{
    currency: string;
    services: { slug: string; name: Localized; priceMinor: number }[];
    packages: { slug: string }[];
  }>("/v1/public/catalog");
