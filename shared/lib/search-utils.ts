export function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

function cleanTelex(word: string): string {
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
