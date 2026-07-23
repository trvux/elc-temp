import { LocationPickerProvider } from "@/shared/providers/location-picker-provider";
import { LocationPickerDialog } from "@/modules/shipping-zone/presentation/components/LocationPickerDialog";
import { getSavedProvinceCode } from "@/modules/shipping-zone/presentation/delivery-cookie";

// Scopes the location-picker auto-prompt to product browsing specifically
// (hub, category, product detail, compare) rather than the whole public
// site — the saved cookie itself still personalizes ProductCard/ProductGrid
// everywhere once set, since any Server Component can read it.
export default async function SanPhamLayout({ children }: { children: React.ReactNode }) {
  const savedProvinceCode = await getSavedProvinceCode();

  return (
    <LocationPickerProvider>
      {children}
      <LocationPickerDialog autoOpen={!savedProvinceCode} />
    </LocationPickerProvider>
  );
}
