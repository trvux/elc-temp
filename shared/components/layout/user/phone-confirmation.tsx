"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface PhoneConfirmationProps {
  phone: string;
  children: React.ReactNode;
}

export function PhoneConfirmation({ phone, children }: PhoneConfirmationProps) {
  const [activeToastId, setActiveToastId] = useState<string | number | null>(
    null,
  );

  const handleTrigger = () => {
    const id = toast(`Hotline: ${phone}`, {
      description: "Kết nối với nhóm hỗ trợ của chúng tôi ngay lập tức.",
      duration: Infinity, // Staying visible until user clicks Call or Outside
      action: {
        label: "Gọi ngay",
        onClick: () => {
          window.location.href = `tel:${phone}`;
          toast.dismiss(id);
          setActiveToastId(null);
        },
      },
      onAutoClose: () => setActiveToastId(null),
      onDismiss: () => setActiveToastId(null),
    });
    setActiveToastId(id);
  };

  useEffect(() => {
    if (activeToastId === null) return;

    const handleClickOutside = (e: MouseEvent) => {
      // Dismiss the toast if user clicks anywhere on the document
      toast.dismiss(activeToastId);
      setActiveToastId(null);
    };

    // Delay a bit to prevent immediate dismissal from the trigger click
    const timer = setTimeout(() => {
      window.addEventListener("click", handleClickOutside);
    }, 100);

    return () => {
      window.removeEventListener("click", handleClickOutside);
      clearTimeout(timer);
    };
  }, [activeToastId]);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation(); // Prevent the click from triggering the handleClickOutside immediately
        handleTrigger();
      }}
      className="cursor-pointer"
    >
      {children}
    </div>
  );
}
