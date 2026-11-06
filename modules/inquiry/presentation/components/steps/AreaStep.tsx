"use client";

import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { SERVICE_AREA_PROVINCES } from "@/shared/lib/service-areas";

export interface AreaAnswer {
  /** The province chip tapped, or the text typed after "Nơi khác". Empty until chosen. */
  region: string;
  /** True when "Nơi khác" was chosen: ELC does not serve this place yet. */
  other: boolean;
  /** The street address, optional. */
  address: string;
}

interface AreaStepProps {
  question: string;
  description?: string;
  value: AreaAnswer;
  onChange: (value: AreaAnswer) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  /** Shown under the chips after Tiếp tục with no region chosen. */
  error?: string | null;
}

const UNDERLINE_INPUT =
  "h-auto border-0 border-b-2 border-white/40 rounded-none bg-transparent px-0 py-2 text-white shadow-none placeholder:text-white/50 focus-visible:border-white focus-visible:ring-0";

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-lg border-2 px-3.5 py-1.5 type-caption transition-colors drop-shadow-sm",
        selected ? "border-primary bg-primary text-primary-foreground" : "border-white/40 text-white hover:border-white",
      )}
    >
      {children}
    </button>
  );
}

// Where the work is: the region is required (it tells staff whether ELC can come at all),
// the street address is not (many visitors will not type it before they trust the site).
// The chips are the provinces ELC has actually served; anything else is "Nơi khác".
export function AreaStep({ question, description, value, onChange, onKeyDown, error }: AreaStepProps) {
  return (
    <div>
      <h1 id="step-question" className="type-headline text-white drop-shadow-sm">
        {question}
      </h1>
      {description && (
        <p id="step-description" className="type-body mt-3 text-white/80 drop-shadow-sm">
          {description}
        </p>
      )}

      <div role="group" aria-labelledby="step-question" className="mt-8 flex flex-wrap gap-2">
        {SERVICE_AREA_PROVINCES.map((province) => (
          <Chip
            key={province}
            selected={!value.other && value.region === province}
            onClick={() => onChange({ ...value, region: province, other: false })}
          >
            {province}
          </Chip>
        ))}
        <Chip selected={value.other} onClick={() => onChange({ ...value, region: value.other ? value.region : "", other: true })}>
          Nơi khác
        </Chip>
      </div>

      {value.other && (
        <Input
          autoFocus
          value={value.region}
          onChange={(e) => onChange({ ...value, region: e.target.value })}
          onKeyDown={onKeyDown}
          maxLength={80}
          aria-label="Tỉnh/thành phố của bạn"
          placeholder="Tỉnh/thành phố của bạn"
          className={cn(UNDERLINE_INPUT, "mt-5")}
        />
      )}

      <div className="mt-8">
        <label htmlFor="area-step-address" className="type-body-sm text-white/90 drop-shadow-sm">
          Địa chỉ cụ thể <span className="text-white/70">(không bắt buộc)</span>
        </label>
        <Input
          id="area-step-address"
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          onKeyDown={onKeyDown}
          maxLength={200}
          placeholder="Số nhà, đường, phường/xã"
          className={cn(UNDERLINE_INPUT, "mt-1")}
        />
      </div>

      {error && (
        <p role="alert" className="type-body-sm mt-5 text-white drop-shadow-sm">
          {error}
        </p>
      )}
    </div>
  );
}
