import Head from "next/head";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  noIndex?: boolean;
}

export function SEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  noIndex = false,
}: SEOProps) {
  const siteName = "ELC - Electric Lighting Catalog";
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDesc = "Giải pháp chiếu sáng chuyên nghiệp cho mọi công trình.";
  const fullDesc = description || defaultDesc;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDesc} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDesc} />
      <meta property="og:type" content={ogType} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDesc} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Head>
  );
}
