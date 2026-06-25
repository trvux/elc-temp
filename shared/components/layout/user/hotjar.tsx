"use client";

import Script from "next/script";

interface HotjarProps {
  id: string;
}

export default function Hotjar({ id }: HotjarProps) {
  if (!id) return null;

  // Check if it is a Contentsquare ID (e.g., "64ddf595f0391")
  const isContentsquare = /^[a-f0-9]+$/i.test(id) && id.length > 8;

  if (isContentsquare) {
    return (
      <Script
        id="contentsquare-analytics"
        src={`https://t.contentsquare.net/uxa/${id}.js`}
        strategy="afterInteractive"
      />
    );
  }

  // Classic Hotjar
  return (
    <Script
      id="hotjar-analytics"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:${id},hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
        `,
      }}
    />
  );
}

