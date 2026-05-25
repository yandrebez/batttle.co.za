import crypto from "crypto";

export type PayFastParams = Record<string, string>;

function encodePayFastValue(value: string): string {
  // Match PayFast/PHP style encoding as closely as possible.
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, "+");
}

/**
 * Build the signature string and MD5 hash it.
 * Per PayFast docs: sort keys, URL-encode values (spaces as +), append passphrase, MD5.
 */
export function buildPayFastSignature(params: PayFastParams, passphrase: string): string {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined),
  );

  const queryString = Object.entries(filtered)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${encodePayFastValue(v)}`)
    .join("&");

  const stringToHash = passphrase
    ? `${queryString}&passphrase=${encodePayFastValue(passphrase)}`
    : queryString;

  return crypto.createHash("md5").update(stringToHash).digest("hex");
}

/**
 * Verify an incoming PayFast ITN signature.
 *
 * IMPORTANT: ITN parameters must be processed in RECEIVED order with empty
 * values included — PayFast signs them that way (PHP urlencode over all fields,
 * in arrival order, before the optional passphrase). Sorting or filtering empties
 * here will always produce a mismatch.
 */
export function verifyPayFastITN(
  rawBody: string,
  passphrase: string,
  incomingSignature: string,
): boolean {
  const parts: string[] = [];

  // URLSearchParams preserves insertion order and URL-decodes values.
  for (const [key, value] of new URLSearchParams(rawBody)) {
    if (key === "signature") continue;
    parts.push(`${key}=${encodePayFastValue(value)}`);
  }

  let stringToHash = parts.join("&");
  if (passphrase) {
    stringToHash += `&passphrase=${encodePayFastValue(passphrase)}`;
  }

  const expected = crypto.createHash("md5").update(stringToHash).digest("hex");
  const normalizedExpected = expected.toLowerCase();
  const normalizedIncoming = incomingSignature.toLowerCase();

  if (normalizedExpected.length !== normalizedIncoming.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(normalizedExpected), Buffer.from(normalizedIncoming));
}

/** @deprecated Use verifyPayFastITN for inbound notification verification. */
export function verifyPayFastSignature(
  params: PayFastParams,
  passphrase: string,
  incomingSignature: string,
): boolean {
  const expected = buildPayFastSignature(params, passphrase);
  const normalizedExpected = expected.toLowerCase();
  const normalizedIncoming = incomingSignature.toLowerCase();

  if (normalizedExpected.length !== normalizedIncoming.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(normalizedExpected), Buffer.from(normalizedIncoming));
}

/**
 * Build the full set of form fields for a PayFast payment redirect.
 * Returns an object including the computed signature field.
 */
export function buildPayFastPayload(
  params: PayFastParams,
  passphrase: string,
): PayFastParams {
  const signature = buildPayFastSignature(params, passphrase);
  return { ...params, signature };
}
