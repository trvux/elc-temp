// 1 kW = 3412.14 BTU/h — a fixed physics conversion, safe to auto-derive for
// display. Unlike this, HP ("ngựa") is a VN retail marketing bucket brands
// assign inconsistently around the BTU value, so it stays its own
// admin-picked select attribute (cong_suat_lam_lanh_hp), never computed.
export const BTU_PER_KW = 3412.14;

export const CAPACITY_BTU_ATTRIBUTE_CODE = "cong_suat_lam_lanh_btu";

export function btuToKw(btu: number): string {
  return (btu / BTU_PER_KW).toFixed(2);
}
