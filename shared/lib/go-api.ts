/**
 * Helpers for Server Actions that call the Go backend (elc-go).
 *
 * Go's JSON tags are snake_case; our domain types are camelCase. Sending a
 * camelCase body straight through `JSON.stringify` does NOT throw — Go's
 * decoder just silently leaves the mismatched field at its zero value
 * (false / 0 / ""). Always build request bodies through `toSnakeCaseBody`
 * instead of passing a TS object directly to `JSON.stringify`.
 */
export function toSnakeCaseBody<T extends object>(input: T): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    body[snakeKey] = value;
  }
  return body;
}
