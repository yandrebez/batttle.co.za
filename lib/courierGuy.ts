export type PudoLocation = {
  id: string;
  name: string;
  addressLine: string;
  suburb: string;
  city: string;
  postalCode: string;
};

const DEFAULT_BASE_URL = "https://api.thecourierguy.co.za";
const DEFAULT_PUDO_PATH = "/v1/pudo/locations";

function normalizeUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function normalizeField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readLocationsCandidate(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  const candidates = [
    record.data,
    record.results,
    record.locations,
    record.pudoPoints,
    record.pudo_locations,
    record.response,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      if (Array.isArray(nested.data)) {
        return nested.data;
      }
      if (Array.isArray(nested.results)) {
        return nested.results;
      }
      if (Array.isArray(nested.locations)) {
        return nested.locations;
      }
    }
  }

  return [];
}

function mapLocationRow(row: unknown): PudoLocation | null {
  if (!row || typeof row !== "object") {
    return null;
  }

  const value = row as Record<string, unknown>;

  const id =
    normalizeField(value.id) ||
    normalizeField(value.code) ||
    normalizeField(value.location_id) ||
    normalizeField(value.pudo_id);

  const name =
    normalizeField(value.name) ||
    normalizeField(value.location_name) ||
    normalizeField(value.title) ||
    "PUDO Pickup Point";

  const addressLine =
    normalizeField(value.addressLine) ||
    normalizeField(value.address) ||
    normalizeField(value.address_1) ||
    normalizeField(value.street);

  const suburb = normalizeField(value.suburb) || normalizeField(value.area);
  const city = normalizeField(value.city) || normalizeField(value.town);
  const postalCode =
    normalizeField(value.postalCode) ||
    normalizeField(value.postcode) ||
    normalizeField(value.postal_code);

  if (!id) {
    return null;
  }

  return {
    id,
    name,
    addressLine,
    suburb,
    city,
    postalCode,
  };
}

export function isCourierGuyConfigured(): boolean {
  const apiKey = (process.env.COURIER_GUY_API_KEY ?? "").trim();
  const username = (process.env.COURIER_GUY_USERNAME ?? "").trim();
  const password = (process.env.COURIER_GUY_PASSWORD ?? "").trim();

  return Boolean(apiKey || (username && password));
}

export async function searchPudoLocations(input: {
  query: string;
  postalCode?: string;
}): Promise<PudoLocation[]> {
  const apiKey = (process.env.COURIER_GUY_API_KEY ?? "").trim();
  const username = (process.env.COURIER_GUY_USERNAME ?? "").trim();
  const password = (process.env.COURIER_GUY_PASSWORD ?? "").trim();

  if (!apiKey && !(username && password)) {
    throw new Error("Courier Guy credentials are not configured.");
  }

  const baseUrl = (process.env.COURIER_GUY_BASE_URL ?? DEFAULT_BASE_URL).trim() || DEFAULT_BASE_URL;
  const pudoPath = (process.env.COURIER_GUY_PUDO_LOCATIONS_PATH ?? DEFAULT_PUDO_PATH).trim() || DEFAULT_PUDO_PATH;
  const url = new URL(normalizeUrl(baseUrl, pudoPath));

  const query = input.query.trim();
  const postalCode = (input.postalCode ?? "").trim();

  if (query) {
    url.searchParams.set("q", query);
    url.searchParams.set("search", query);
  }

  if (postalCode) {
    url.searchParams.set("postalCode", postalCode);
    url.searchParams.set("postcode", postalCode);
  }

  url.searchParams.set("limit", "25");

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
    headers["X-Api-Key"] = apiKey;
  } else if (username && password) {
    headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Courier Guy API request failed.");
  }

  const payload = (await response.json()) as unknown;
  const rows = readLocationsCandidate(payload);

  return rows
    .map(mapLocationRow)
    .filter((row): row is PudoLocation => row !== null);
}
