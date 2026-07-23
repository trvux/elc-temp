// Split out from delivery-cookie.ts (which is "use server" and therefore
// may only export async functions) so both that file and actions.ts can
// share the exact cookie names without duplicating the literals.
export const DELIVERY_PROVINCE_COOKIE = "elc_delivery_province";
// Ward (phường/xã) — the real bottom tier of the address hierarchy, saved
// alongside province so ProductGrid's site-wide personalization can be as
// precise as the on-demand DeliveryEstimate widget.
export const DELIVERY_WARD_COOKIE = "elc_delivery_ward";
