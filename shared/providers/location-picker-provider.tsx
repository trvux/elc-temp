"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface LocationPickerContextValue {
  isOpen: boolean;
  openLocationPicker: () => void;
  closeLocationPicker: () => void;
}

const LocationPickerContext = createContext<LocationPickerContextValue>({
  isOpen: false,
  openLocationPicker: () => {},
  closeLocationPicker: () => {},
});

// Holds just the open/closed flag — LocationPickerDialog (mounted once in
// app/(public)/san-pham/layout.tsx) reads it to render itself, and any
// descendant (e.g. DeliveryEstimate's "Đổi khu vực đã lưu" link) can call
// openLocationPicker() to reopen it on demand, not just on first auto-show.
export function LocationPickerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openLocationPicker = useCallback(() => setIsOpen(true), []);
  const closeLocationPicker = useCallback(() => setIsOpen(false), []);

  return (
    <LocationPickerContext.Provider value={{ isOpen, openLocationPicker, closeLocationPicker }}>
      {children}
    </LocationPickerContext.Provider>
  );
}

export function useLocationPicker() {
  return useContext(LocationPickerContext);
}
