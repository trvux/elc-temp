import { getBranchBySlug, getBranches } from "@/modules/branch";
import { setUseStaticClient } from "@/shared/lib/supabase/server";
import { cacheLife } from "next/cache";
import { Metadata } from "next";
import InformationHub from "../page";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const branches = await getBranches({ isPublished: true });
  return (branches ?? []).map((b) => ({ slug: b.slug }));
}

async function getBranchData(slug: string) {
  "use cache";
  cacheLife("hours");
  setUseStaticClient(true);
  return getBranchBySlug(slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const branch = await getBranchData(slug);

  if (!branch || !branch.isPublished) {
    return {
      title: "Không tìm thấy thông tin | ELC",
    };
  }

  const title = branch.metaTitle || `${branch.name} | Điện máy ELC`;
  const description = branch.metaDescription || branch.name;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: branch.imageUrl ? [branch.imageUrl] : [],
    },
  };
}

export default InformationHub;
