/**
 * Returns true if the URL should count toward pause tracking.
 */
export function urlMatchesSettings(url, settings) {
  if (!url || !settings?.enabled) return false;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) return false;

  if (settings.mode === "all") return true;

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const sites = (settings.sites || []).map(normalizeDomain).filter(Boolean);

  return sites.some((site) => host === site || host.endsWith("." + site));
}

export function normalizeDomain(input) {
  if (!input || typeof input !== "string") return "";
  let value = input.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.replace(/^www\./, "");
  value = value.split("/")[0].split("?")[0];
  return value;
}
