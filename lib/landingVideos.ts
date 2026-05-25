function normalizeParsedEntries(entries: string[]): string[] {
  const cleaned = entries.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  const repaired: string[] = [];

  for (let i = 0; i < cleaned.length; i += 1) {
    const current = cleaned[i];
    const next = cleaned[i + 1];

    const canRepairSplitDataUrl =
      current.startsWith("data:") &&
      current.includes(";base64") &&
      !current.includes(",") &&
      typeof next === "string" &&
      /^[A-Za-z0-9+/=]+$/.test(next);

    if (canRepairSplitDataUrl) {
      repaired.push(`${current},${next}`);
      i += 1;
      continue;
    }

    repaired.push(current);
  }

  return repaired;
}

export function parseLandingVideoUrls(raw: string): string[] {
  const value = raw.trim();
  if (!value) {
    return [];
  }

  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return normalizeParsedEntries(
          parsed
            .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
            .filter((entry) => entry.length > 0),
        );
      }
    } catch {
      // Fall through to delimiter parsing.
    }
  }

  // Data URLs contain commas (e.g. data:video/mp4;base64,....), so
  // newline-delimited parsing avoids corrupting uploaded base64 videos.
  const newlineEntries = value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (newlineEntries.length > 1) {
    return normalizeParsedEntries(newlineEntries);
  }

  const single = newlineEntries[0] || "";
  if (!single) {
    return [];
  }

  if (single.startsWith("data:")) {
    return [single];
  }

  // Backward compatibility for older comma-delimited plain URL values.
  return normalizeParsedEntries(
    single
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0),
  );
}

export function serializeLandingVideoUrls(urls: string[]): string {
  const cleaned = urls.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  if (!cleaned.length) {
    return "";
  }

  if (cleaned.length === 1) {
    return cleaned[0];
  }

  return JSON.stringify(cleaned);
}
