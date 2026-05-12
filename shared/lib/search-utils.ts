export function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

export function tokenize(str: string): string[] {
  return normalize(str)
    .split(/[^a-z0-9.]+/)
    .filter((t) => t.length > 0);
}

export function cleanTelex(word: string): string {
  if (!/[aeiou]/.test(word)) return word;
  return word.replace(/[fjx]$/, "").replace(/([aeiou])w/g, "$1");
}


export function getQueryTokens(q: string): string[] {
  if (!q) return [];
  return normalize(q)
    .split(/\s+/)
    .map(cleanTelex)
    .filter((t) => t.length >= 1);
}
