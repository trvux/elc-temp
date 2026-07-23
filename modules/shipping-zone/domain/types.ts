export interface Province {
  code: string;
  name: string;
}

// Ward is a phường/xã — the real bottom tier of Vietnam's administrative
// hierarchy since the July 2025 reform abolished quận/huyện entirely.
export interface Ward {
  code: string;
  name: string;
  provinceCode: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  feeVnd: number;
  minDays: number;
  maxDays: number;
  isDefault: boolean;
  provinceCodes: string[];
  wardCodes: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateShippingZoneInput {
  name: string;
  feeVnd: number;
  minDays: number;
  maxDays: number;
  isDefault?: boolean;
  provinceCodes: string[];
  wardCodes: string[];
}

export interface UpdateShippingZoneInput extends Partial<CreateShippingZoneInput> {
  id: string;
}

export interface ShippingZoneFilter {
  includeDeleted?: boolean;
}

// ZoneLookupResult mirrors elc-go's lookupResponse — the fee/day-range for a
// specific province + ward (or the site-wide default when there's no ward
// to match against).
export interface ZoneLookupResult {
  zoneName: string;
  feeVnd: number;
  minDays: number;
  maxDays: number;
}
