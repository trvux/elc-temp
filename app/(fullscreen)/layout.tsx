// Lead-capture form pages deliberately skip the (public) group's Header/
// Footer/site chrome for a distraction-free, Typeform-style takeover — same
// pattern as (auth).
export const dynamic = "force-dynamic";

export default function FullscreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
