import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/[-_\s/]+/).filter((t) => t.length > 0);
}

function calculateScore(oldTokens: string[], candidateTokens: string[]): number {
  let score = 0;
  for (const token of oldTokens) {
    if (candidateTokens.includes(token)) {
      const hasLetter = /[a-z]/i.test(token);
      const hasNumber = /[0-9]/.test(token);
      if (hasLetter && hasNumber) {
        score += 10;
      } else {
        score += 2;
      }
    }
  }
  return score;
}

async function findFuzzyRedirect(
  oldSlug: string,
  allowedTypes: string[]
): Promise<{ pathname: string } | null> {
  const oldTokens = tokenize(oldSlug);
  if (oldTokens.length === 0) return null;

  const { data: registry } = await supabase
    .from("slug_registry")
    .select("slug, entity_type")
    .is("deleted_at", null);

  if (registry) {
    const filteredRegistry = registry.filter((item) =>
      allowedTypes.includes(item.entity_type)
    );

    let bestMatch: typeof filteredRegistry[0] | null = null;
    let maxScore = 0;

    for (const item of filteredRegistry) {
      const candidateTokens = tokenize(item.slug);
      const score = calculateScore(oldTokens, candidateTokens);
      if (score > maxScore) {
        maxScore = score;
        bestMatch = item;
      }
    }

    if (bestMatch && maxScore >= 4) {
      if (["product", "category", "categories", "brand", "group"].includes(bestMatch.entity_type)) {
        return { pathname: `/san-pham/${bestMatch.slug}` };
      }
      if (["project", "project_type"].includes(bestMatch.entity_type)) {
        return { pathname: `/du-an/${bestMatch.slug}` };
      }
    }
  }
  return null;
}

async function resolveRedirectPath(
  oldSlug: string,
  defaultBase: "san-pham" | "du-an" | "tin-tuc" | "danh-muc"
): Promise<string> {
  let allowedTypes: string[] = [];
  if (defaultBase === "san-pham") {
    allowedTypes = ["product", "category", "categories", "brand", "group"];
  } else if (defaultBase === "danh-muc") {
    allowedTypes = ["category", "categories", "group"];
  } else if (defaultBase === "du-an") {
    allowedTypes = ["project", "project_type"];
  } else {
    allowedTypes = ["news"];
  }

  // Exact check
  const { data: registryItem, error } = await supabase
    .from("slug_registry")
    .select("entity_type, slug")
    .eq("slug", oldSlug)
    .is("deleted_at", null)
    .maybeSingle();

  console.log("Exact check result:", { registryItem, error });

  if (registryItem && allowedTypes.includes(registryItem.entity_type)) {
    if (["product", "category", "categories", "brand", "group"].includes(registryItem.entity_type)) {
      return `/san-pham/${registryItem.slug}`;
    }
    if (["project", "project_type"].includes(registryItem.entity_type)) {
      return `/du-an/${registryItem.slug}`;
    }
  }

  console.log("Falling back to fuzzy check...");
  const fuzzy = await findFuzzyRedirect(oldSlug, allowedTypes);
  if (fuzzy) {
    return fuzzy.pathname;
  }

  if (defaultBase === "san-pham" || defaultBase === "danh-muc") {
    return "/san-pham";
  }
  if (defaultBase === "du-an") {
    return "/du-an";
  }
  return "/";
}

async function test() {
  console.log("Test 1: may-lanh-treo-tuong with san-pham");
  const r1 = await resolveRedirectPath("may-lanh-treo-tuong", "san-pham");
  console.log("Result 1:", r1);

  console.log("\nTest 2: may-lanh-treo-tuong with danh-muc");
  const r2 = await resolveRedirectPath("may-lanh-treo-tuong", "danh-muc");
  console.log("Result 2:", r2);

  console.log("\nTest 3: may-cap-khi-tuoi with danh-muc");
  const r3 = await resolveRedirectPath("may-cap-khi-tuoi", "danh-muc");
  console.log("Result 3:", r3);

  console.log("\nTest 4: may-cap-khi-tuoi with san-pham");
  const r4 = await resolveRedirectPath("may-cap-khi-tuoi", "san-pham");
  console.log("Result 4:", r4);
}

test();
