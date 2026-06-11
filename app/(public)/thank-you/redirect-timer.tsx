"use client";

import { Button } from "@/shared/components/ui/button";
import { ButtonGroup } from "@/shared/components/ui/button-group";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function RedirectTimer({ delay = 15 }: { delay?: number }) {
  const [countdown, setCountdown] = useState(delay);
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined") {
      if (
        document.referrer &&
        document.referrer.indexOf(window.location.host) !== -1
      ) {
        router.back();
      } else {
        router.push("/");
      }
    }
  }, [router]);

  useEffect(() => {
    if (countdown <= 0) {
      handleBack();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, handleBack]);

  return (
    <div className="flex flex-col items-center space-y-6">
      <p className="text-sm italic text-muted-foreground">
        Trang sẽ tự động quay lại sau{" "}
        <span className="text-lg text-bold italic text-foreground">
          {countdown}
        </span>{" "}
        giây
      </p>

      <ButtonGroup>
        <Button
          variant="outline"
          size="lg"
          onClick={handleBack}
          className="px-3"
        >
          <ArrowLeft />
        </Button>
        <Button onClick={handleBack} variant="outline" size="lg">
          Quay lại ngay
        </Button>
      </ButtonGroup>
    </div>
  );
}
