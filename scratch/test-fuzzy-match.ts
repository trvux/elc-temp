import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const testOldSlugs = [
  "2hp-fva50amvm",
  "daikin-15hp-fdbnq13mv1v",
  "may-lanh-ap-tran-daikin-45hp-3-pha",
  "40hp-fba100bvma9",
  "daikin-2hp-fcnq18mv1",
  "may-lanh-ap-tran-daikin-inverter-55hp-1-pha",
  "menred-may-cap-khi-tuoi-khu-nom-g2-g2",
];

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/[-_\s/]+/).filter((t) => t.length > 0);
}

function calculateScore(oldTokens: string[], candidateTokens: string[]): number {
  let score = 0;
  for (const token of oldTokens) {
    if (candidateTokens.includes(token)) {
      // Prioritize tokens with both letters and numbers (model codes)
      const hasLetter = /[a-z]/i.test(token);
      const hasNumber = /[0-9]/.test(token);
      if (hasLetter && hasNumber) {
        score += 10; // High priority for model codes/capacities (e.g. fva50amvm, 2hp, 15hp)
      } else {
        score += 2; // Normal match
      }
    }
  }
  return score;
}

async function run() {
  console.log("Fetching all slug registry items...");
  const { data: registry } = await supabase
    .from("slug_registry")
    .select("slug, entity_type")
    .is("deleted_at", null);

  if (!registry) {
    console.error("No registry items found!");
    return;
  }

  const tokenizedRegistry = registry.map((item) => ({
    ...item,
    tokens: tokenize(item.slug),
  }));

  console.log("\nTesting fuzzy matching results:\n");

  for (const oldSlug of testOldSlugs) {
    const oldTokens = tokenize(oldSlug);
    let bestMatch: typeof tokenizedRegistry[0] | null = null;
    let maxScore = 0;

    for (const candidate of tokenizedRegistry) {
      const score = calculateScore(oldTokens, candidate.tokens);
      if (score > maxScore) {
        maxScore = score;
        bestMatch = candidate;
      }
    }

    console.log(`Old Slug: "${oldSlug}"`);
    if (bestMatch && maxScore >= 4) {
      console.log(`-> MATCH FOUND: "${bestMatch.slug}" (Score: ${maxScore}, Type: ${bestMatch.entity_type})`);
    } else {
      console.log(`-> NO MATCH FOUND (Best score was ${maxScore})`);
    }
    console.log("-".repeat(50));
  }
}

run().catch(console.error);
