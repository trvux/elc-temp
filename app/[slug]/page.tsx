import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("pages")
    .select("title, meta_title, meta_description")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!data) return { title: "Không tìm thấy trang" };

  return {
    title: data.meta_title || data.title,
    description: data.meta_description || undefined,
    openGraph: {
      title: data.meta_title || data.title,
      description: data.meta_description || undefined,
    },
  };
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("title, content")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!page) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
      <div
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: page.content ?? "" }}
      />
    </main>
  );
}
