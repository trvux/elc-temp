import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/sections/hero";
import { FeaturesSection } from "@/components/sections/features";
import { ShowcaseSection } from "@/components/sections/showcase";
import { CTASection } from "@/components/sections/cta";

export default async function Home() {
  const supabase = await createClient();

  // Fetch all necessary data for the homepage
  const [
    { data: settingsData },
    { data: projects },
    { data: featuredProducts },
  ] = await Promise.all([
    supabase.from("site_settings").select("*"),
    supabase
      .from("projects")
      .select("*, categories(name)")
      .eq("is_published", true)
      .order("order_index", { ascending: true })
      .limit(5),
    supabase
      .from("products")
      .select("*, categories(name)")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("order_index", { ascending: true })
      .limit(6),
  ]);

  // Convert settings array to a more usable object
  const settings: Record<string, string> = {};
  settingsData?.forEach((item) => {
    settings[item.key] = item.value;
  });

  return (
    <main className="relative flex flex-col w-full bg-background selection:bg-primary selection:text-primary-foreground min-h-screen overflow-x-hidden">
      {/* 1. HERO SECTION - Light */}
      <div className="w-full bg-background text-foreground pb-12 sm:pb-20 lg:pb-32">
        <HeroSection
          title={settings.hero_title}
          subtitle={settings.hero_subtitle}
          ctaText={settings.hero_cta_text}
          ctaUrl={settings.hero_cta_url}
          coverImage={projects?.[0]?.images?.[0]}
        />
      </div>

      {/* 2. SHOWCASE SECTION (Projects) - Dark Seamless Overlap */}
      <div
        className="w-full relative dark bg-background text-foreground -mt-12 sm:-mt-20 lg:-mt-32 min-h-screen flex flex-col shadow-[0_-20px_40px_rgba(0,0,0,0.1)] border-t border-white/5 overflow-hidden"
        style={{
          borderTopLeftRadius: "clamp(1.5rem, 4vw, 6rem)",
          borderTopRightRadius: "clamp(1.5rem, 4vw, 6rem)",
        }}
      >
        <ShowcaseSection projects={projects || []} />
      </div>

      {/* 3. PRODUCTS SECTION (Features) - Soft Contrast Seamless Overlap */}
      <div
        className="w-full relative bg-secondary text-secondary-foreground -mt-12 sm:-mt-20 lg:-mt-32 min-h-screen flex flex-col shadow-[0_-20px_40px_rgba(0,0,0,0.05)] border-t border-border/50 overflow-hidden"
        style={{
          borderTopLeftRadius: "clamp(1.5rem, 4vw, 6rem)",
          borderTopRightRadius: "clamp(1.5rem, 4vw, 6rem)",
        }}
      >
        <FeaturesSection products={featuredProducts || []} />
      </div>

      {/* 4. CTA SECTION - Dark High Contrast Seamless Overlap */}
      <div
        className="w-full relative dark bg-background text-foreground -mt-12 sm:-mt-20 lg:-mt-32 min-h-screen flex flex-col shadow-[0_-20px_40px_rgba(0,0,0,0.15)] border-t border-white/5 overflow-hidden"
        style={{
          borderTopLeftRadius: "clamp(1.5rem, 4vw, 6rem)",
          borderTopRightRadius: "clamp(1.5rem, 4vw, 6rem)",
        }}
      >
        <CTASection settings={settings} />
      </div>
    </main>
  );
}
