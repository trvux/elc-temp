import { createStaticClient } from "@/shared/lib/supabase/static";

export async function getPublicLayoutData() {
  const supabase = createStaticClient();

  const [
    { data: settings },
    { data: contacts },
    { data: branches },
    { data: projects },
    { data: pages },
    { data: minPriceProd },
    { data: maxPriceProd }
  ] = await Promise.all([
    supabase.from("settings").select("*").maybeSingle(),
    supabase.from("contacts").select("*"),
    supabase.from("branches").select("*"),
    supabase.from("projects").select("id, title, slug, categories(slug)").eq("is_published", true).limit(5),
    supabase.from("pages").select("id, title, slug").eq("is_published", true),
    supabase.from("products").select("price").eq("is_published", true).gt("price", 0).order("price", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("products").select("price").eq("is_published", true).gt("price", 0).order("price", { ascending: false }).limit(1).maybeSingle()
  ]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  
  const priceRange = minPriceProd && maxPriceProd 
    ? `${formatCurrency(minPriceProd.price)} - ${formatCurrency(maxPriceProd.price)}`
    : "10.000.000đ - 100.000.000đ";

  return {
    settings: settings || {},
    contacts: contacts || [],
    branches: branches || [],
    projects: projects || [],
    pages: pages || [],
    priceRange
  };
}
