import {
  formatAttributeValue,
  resolveProductDisplayPrice,
  type ProductWithRelations,
} from "@/modules/catalog/domain";

// A comparison table's diff rows (see ChatComparisonTable) answer "how do
// these differ" — this file answers the next question a shopper actually
// asks, "so which one's better?". Deliberately narrow: only the handful of
// numeric attributes where "higher/lower is better" is objective fact, not
// a judgment call this app has no business making (see ComparisonTable's
// own doc comment on why it never highlights a "winner" generically — a
// bigger HP or BTU number isn't "better", just bigger, and we have no
// per-attribute directionality data to know which arbitrary spec even
// should be). Price, energy efficiency (CSPF — higher literally means more
// cooling per watt), and power draw (lower literally means less
// electricity used) are the few where that direction is unambiguous
// regardless of product category.
export interface ComparisonCriterion {
  key: string;
  label: string;
  // The chip text offered as a follow-up suggestion after a compare turn,
  // and also what isCriterionFollowUp matches an incoming message against.
  question: string;
  direction: "higher" | "lower";
  getValue: (product: ProductWithRelations) => number | null;
  formatValue: (product: ProductWithRelations) => string;
}

function findAttribute(product: ProductWithRelations, code: string) {
  return (product.attributeValues || []).find((av) => av.code === code) ?? null;
}

export const COMPARISON_CRITERIA: ComparisonCriterion[] = [
  {
    key: "price",
    label: "Giá",
    question: "Loại nào rẻ nhất?",
    direction: "lower",
    getValue: (product) => resolveProductDisplayPrice(product),
    formatValue: (product) => {
      const price = resolveProductDisplayPrice(product);
      return price != null ? `${price.toLocaleString("vi-VN")}đ` : "—";
    },
  },
  {
    // hieu_suat_cspf: BTU of cooling per watt of electricity — a ratio, so
    // higher is unambiguously more efficient regardless of the unit the
    // product's raw capacity happens to be in.
    key: "hieu_suat_cspf",
    label: "Hiệu suất năng lượng (CSPF)",
    question: "Loại nào tiết kiệm điện nhất (CSPF)?",
    direction: "higher",
    getValue: (product) => findAttribute(product, "hieu_suat_cspf")?.valueNumber ?? null,
    formatValue: (product) => {
      const av = findAttribute(product, "hieu_suat_cspf");
      return av ? formatAttributeValue(av) : "—";
    },
  },
  {
    // dien_nang_tieu_thu: raw wattage draw — lower is less electricity
    // used, independent of CSPF (a product can have a worse CSPF ratio but
    // still draw less raw power if it's simply a smaller-capacity unit).
    key: "dien_nang_tieu_thu",
    label: "Điện năng tiêu thụ",
    question: "Loại nào tiêu thụ điện thấp nhất?",
    direction: "lower",
    getValue: (product) => findAttribute(product, "dien_nang_tieu_thu")?.valueNumber ?? null,
    formatValue: (product) => {
      const av = findAttribute(product, "dien_nang_tieu_thu");
      return av ? formatAttributeValue(av) : "—";
    },
  },
];

// Only offer a criterion as a follow-up suggestion (or recognize it in an
// incoming message) when at least 2 of the compared products actually
// carry that value *and* it's not identical across all of them — same
// "don't surface something that can't actually distinguish these
// products" rule buildDiffRows applies to spec rows.
export function applicableCriteria(products: ProductWithRelations[]): ComparisonCriterion[] {
  return COMPARISON_CRITERIA.filter((criterion) => {
    const values = products.map((p) => criterion.getValue(p)).filter((v): v is number => v != null);
    if (values.length < 2) return false;
    return values.some((v) => v !== values[0]);
  });
}

export interface CriterionRanking {
  criterion: ComparisonCriterion;
  // Best value first — every product that actually carries this
  // criterion's value (a product missing it entirely is left out rather
  // than guessed at).
  ranked: { product: ProductWithRelations; formatted: string }[];
}

export function rankByCriterion(
  products: ProductWithRelations[],
  criterion: ComparisonCriterion,
): CriterionRanking {
  const withValue = products
    .map((product) => ({ product, value: criterion.getValue(product) }))
    .filter((entry): entry is { product: ProductWithRelations; value: number } => entry.value != null);

  withValue.sort((a, b) => (criterion.direction === "higher" ? b.value - a.value : a.value - b.value));

  return {
    criterion,
    ranked: withValue.map(({ product }) => ({ product, formatted: criterion.formatValue(product) })),
  };
}

// Matches a follow-up asking specifically about one of applicableCriteria's
// dimensions ("loại nào rẻ nhất?", "cái nào tiết kiệm điện hơn?") — checked
// against the *previous compare turn's own products* (see
// ProductChatFinder's submitMessage), so this never needs to guess intent
// from a bare category name, only from wording that names the criterion
// itself.
// "tiết kiệm điện" is deliberately on BOTH efficiency criteria, not just
// hieu_suat_cspf — a shopper means "uses less electricity" regardless of
// which specific attribute the catalog happens to carry for a given
// product line. Real bug caught from this exact ambiguity: a compare turn
// whose products only had dien_nang_tieu_thu data (no CSPF value at all,
// so applicableCriteria excluded hieu_suat_cspf entirely) meant "cái nào
// tiết kiệm điện?" matched nothing — the only pattern with that phrase
// belonged to a criterion that had already been filtered out — and fell
// through every check all the way down to a fresh, signal-less
// chatSearchProductsAction call. Keeping the phrase on both means whichever
// efficiency criterion actually made it into `criteria` (applicableCriteria
// already guarantees that's a real, differing value — see its own doc
// comment) still gets matched.
const CRITERION_KEYWORD_PATTERNS: Record<string, RegExp> = {
  price: /rẻ|giá|tiết kiệm chi phí/i,
  hieu_suat_cspf: /cspf|hiệu suất|hiệu quả năng lượng|tiết kiệm điện/i,
  dien_nang_tieu_thu: /tiêu thụ điện|hao điện|tốn điện|ngốn điện|tiết kiệm điện/i,
};

export function matchCriterionFollowUp(
  message: string,
  criteria: ComparisonCriterion[],
): ComparisonCriterion | null {
  for (const criterion of criteria) {
    const pattern = CRITERION_KEYWORD_PATTERNS[criterion.key];
    if (pattern && pattern.test(message)) return criterion;
  }
  return null;
}
