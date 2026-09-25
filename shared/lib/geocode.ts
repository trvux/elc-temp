// Server-only: calls Google Geocoding API to turn a browser-captured
// lat/lng into a readable "Phường X, Quận Y, Thành phố Z" string for staff
// (see shared/lib/geolocation.ts for how the coords get here). Never
// called from client code — GEOCODING_API_KEY has no NEXT_PUBLIC_ prefix,
// so Next.js never bundles it to the browser; only Route Handlers and
// Server Actions ever import this file.
//
// Deliberately returns ward/district/city (address_components), not the
// full formatted_address (which includes house number/street) — this
// feature exists to show staff a "khu vực" for follow-up, not to store an
// exact home address permanently.

interface GeocodeResult {
  address_components: { long_name: string; types: string[] }[];
  formatted_address: string;
}

interface GeocodeResponse {
  status: string;
  results: GeocodeResult[];
}

const WANTED_TYPES = ["sublocality", "administrative_area_level_2", "administrative_area_level_1"];

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const apiKey = process.env.GEOCODING_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=vi&key=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;

    const data = (await res.json()) as GeocodeResponse;
    if (data.status !== "OK" || data.results.length === 0) return null;

    const components = data.results[0].address_components;
    const parts = WANTED_TYPES.map(
      (type) => components.find((c) => c.types.includes(type))?.long_name,
    ).filter((v): v is string => Boolean(v));

    return parts.length > 0 ? parts.join(", ") : data.results[0].formatted_address;
  } catch {
    // Network hiccup / timeout — never let this block an inquiry submit.
    return null;
  }
}
