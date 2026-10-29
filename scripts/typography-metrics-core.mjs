// Pure helpers for scripts/typography-metrics.mjs (no browser here, so they are unit-testable).
//
// A snapshot is { meta, pages: { "<path>@<width>": { height, headings, items } } } where each item is
//   { k: "<tag>|<first 50 chars of text>#<n>", tag, fs, fw, lh, ls, h }
// fs/lh/ls are computed px strings, fw the computed weight, h the rendered height in px.

export const PROPS = ["fs", "fw", "lh", "ls"];

export function keyItems(items) {
  const seen = new Map();
  return items.map((it) => {
    const base = `${it.tag}|${it.text}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return { ...it, k: `${base}#${n}` };
  });
}

function shape(it) {
  return `${it.fs}/${it.fw}/${it.lh}${it.ls && it.ls !== "normal" ? `/${it.ls}` : ""}`;
}

export function diffPage(a, b) {
  const aMap = new Map(a.items.map((i) => [i.k, i]));
  const bMap = new Map(b.items.map((i) => [i.k, i]));
  const transitions = new Map(); // "14px/400/20px -> 14px/400/21px" -> count
  let changed = 0;
  let heightDeltaSum = 0;
  for (const [k, ia] of aMap) {
    const ib = bMap.get(k);
    if (!ib) continue;
    if (PROPS.some((p) => ia[p] !== ib[p])) {
      changed++;
      const t = `${shape(ia)} -> ${shape(ib)}`;
      transitions.set(t, (transitions.get(t) ?? 0) + 1);
    }
    heightDeltaSum += ib.h - ia.h;
  }
  const removed = [...aMap.keys()].filter((k) => !bMap.has(k)).length;
  const added = [...bMap.keys()].filter((k) => !aMap.has(k)).length;
  const hs = (p) => p.headings.map((h) => `${h.tag}:${h.text}`);
  const headingsSame = JSON.stringify(hs(a)) === JSON.stringify(hs(b));
  return {
    matched: [...aMap.keys()].filter((k) => bMap.has(k)).length,
    changed,
    removed,
    added,
    transitions: [...transitions.entries()].sort((x, y) => y[1] - x[1]),
    headingsSame,
    h1Before: a.headings.filter((h) => h.tag === "h1").length,
    h1After: b.headings.filter((h) => h.tag === "h1").length,
    headingsBefore: hs(a),
    headingsAfter: hs(b),
    pageHeightDelta: Math.round((b.height - a.height) * 10) / 10,
    textHeightDeltaSum: Math.round(heightDeltaSum * 10) / 10,
  };
}

export function diffSnapshots(a, b, onlyPage) {
  const out = {};
  for (const key of Object.keys(a.pages)) {
    if (onlyPage && !key.startsWith(onlyPage + "@")) continue;
    if (!b.pages[key]) {
      out[key] = { missing: true };
      continue;
    }
    out[key] = diffPage(a.pages[key], b.pages[key]);
  }
  return out;
}

export function isClean(d) {
  return !d.missing && d.changed === 0 && d.removed === 0 && d.added === 0 && d.headingsSame && d.pageHeightDelta === 0;
}
