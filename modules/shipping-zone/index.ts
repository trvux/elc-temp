export * from "./domain";
export * from "./presentation/actions";
export * from "./presentation/components/ShippingZoneManagement";

// getSavedProvinceCode (presentation/delivery-cookie.ts) is deliberately NOT
// re-exported here: it uses next/headers, which must never end up in a
// client bundle. Server Components that need it should import
// "@/modules/shipping-zone/presentation/delivery-cookie" directly.
