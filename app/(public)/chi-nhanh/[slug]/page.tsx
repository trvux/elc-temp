import React from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BranchTOC } from "@/components/user/branch-toc";
import { MapPin, Phone, Mail, Navigation2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneConfirmation } from "@/components/user/phone-confirmation";
import { Separator } from "@/components/ui/separator";
import { ScrollToTop } from "@/components/user/scroll-to-top";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BranchDetail({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch all published branches for the TOC
  const { data: allBranches } = await supabase
    .from("branches")
    .select("id, name, slug")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  // Fetch current branch data
  const { data: branch } = await supabase
    .from("branches")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!branch || !allBranches) {
    notFound();
  }

  return (
    <main className="w-full pt-28 pb-24 px-4 md:px-6 min-h-screen font-sans tracking-tight">
      <div className="max-w-4xl mx-auto">
        {/* TOC Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-md md:text-lg font-bold capitalize tracking-widest text-foreground opacity-90 truncate">
            Không Gian Kiến Trúc
          </div>
          <div className="scale-90 origin-left md:origin-right shrink-0">
            <BranchTOC branches={allBranches} currentSlug={slug} />
          </div>
        </header>
        <Separator className="mb-16" />

        <article className="animate-in fade-in duration-1000 ease-out">
          {/* Massive Title */}
          <div className="mb-16">
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-foreground leading-[0.85] lowercase first-letter:capitalize">
              {branch.name}
            </h1>
          </div>

          {/* Branch Details Grid (Premium Black & White blocks) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 my-20">
            {/* Dark Card - Location */}
            <div className="aspect-square bg-primary text-primary-foreground p-8 md:p-10 flex flex-col justify-end">
              <div className="mb-auto">
                <div className="w-8 h-8 rounded-full border border-primary-foreground/20 flex items-center justify-center">
                  <MapPin
                    size={12}
                    className="text-primary-foreground"
                    strokeWidth={3}
                  />
                </div>
              </div>
              <h3 className="text-fluid-h2 font-bold mb-4 tracking-tight">
                Tọa độ chính thức
              </h3>
              <p className="text-fluid-base text-primary-foreground/60 font-medium leading-[1.6]">
                {branch.address}
              </p>
              <a
                href={branch.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-fluid-xs font-bold text-primary-foreground capitalize tracking-[0.2em] hover:underline hover:underline-offset-4 mt-8 transition-all"
              >
                Chỉ đường di chuyển{" "}
                <Navigation2 size={12} className="rotate-45" />
              </a>
            </div>

            {/* Light Card - Contact */}
            <div className="aspect-square bg-muted/30 p-8 md:p-10 flex flex-col justify-between border border-border/40">
              <div className="text-[10px] font-bold capitalize tracking-[0.3em] text-muted-foreground/40">
                Kết nối trực tiếp
              </div>
              <div className="flex flex-col gap-10">
                <div>
                  <span className="text-fluid-xs capitalize font-bold tracking-[0.2em] text-muted-foreground/30 block mb-2">
                    Đường dây nóng
                  </span>
                  <PhoneConfirmation phone={branch.phone}>
                    <div className="text-4xl md:text-5xl font-black tracking-tighter text-foreground cursor-pointer hover:text-primary transition-colors leading-none">
                      {branch.phone}
                    </div>
                  </PhoneConfirmation>
                </div>

                <div>
                  <span className="text-fluid-xs capitalize font-bold tracking-[0.2em] text-muted-foreground/30 block mb-2">
                    Thư điện tử
                  </span>
                  <a
                    href={`mailto:${branch.email}`}
                    className="text-fluid-base font-bold tracking-tight text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {branch.email}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Description with Clean Editorial Typography */}
          {branch.description && branch.description.trim() !== "" && (
            <>
              <Separator className="mt-32 mb-20" />
              <div className="mb-32">
                <div
                  className="prose prose-zinc prose-lg max-w-none 
                      font-sans 
                      prose-p:leading-[1.8] prose-p:text-fluid-base prose-p:text-muted-foreground/80 prose-p:font-medium
                      prose-headings:font-sans prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-foreground 
                      prose-headings:text-3xl md:prose-headings:text-5xl
                      prose-headings:mt-16 prose-headings:mb-8
                      prose-a:text-primary prose-a:underline prose-a:underline-offset-4
                      prose-strong:text-foreground"
                  dangerouslySetInnerHTML={{ __html: branch.description }}
                />
              </div>
            </>
          )}

          {/* Interactive Map Section - Massive Edge-to-Edge */}
          {branch.maps_embed && (
            <>
              <Separator className="my-20" />
              <div className="mt-16">
                {/* Meaningful Context Label */}
                <div className="mb-10 text-center">
                  <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-foreground">
                    Maps
                  </h2>
                </div>

                <div className="w-[100vw] relative left-1/2 -translate-x-1/2 h-[50vh] md:h-[70vh] min-h-[500px] bg-muted/20 border-y border-border">
                  <iframe
                    src={
                      branch.maps_embed.match(/src="([^"]+)"/)?.[1] ||
                      branch.maps_embed
                    }
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale hover:grayscale-0 transition-all duration-[2000ms] ease-in-out w-full h-full"
                  />
                </div>
              </div>
            </>
          )}
        </article>

        <footer className="mt-24 pt-8 border-t border-border flex items-center justify-between text-sm text-muted-foreground font-medium">
          <span>&copy; {new Date().getFullYear()} ELC Global Network</span>
          <ScrollToTop className="hover:text-foreground transition-colors">
            Trở lên đầu trang
          </ScrollToTop>
        </footer>
      </div>
    </main>
  );
}
