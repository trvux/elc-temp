// Auth pages (login, verify) deliberately skip the (public) group's Header/
// Footer/site chrome — they render their own minimal AuthLayout instead.
export const dynamic = "force-dynamic";

export default function AuthRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
