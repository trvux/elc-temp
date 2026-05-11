"use client";

import { Contact } from "@/modules/contact/domain";
import {
  StaggerContainer,
  StaggerItem,
} from "@/shared/components/ui/animate-in";
import { Button } from "@/shared/components/ui/button";
import { useRouter } from "next/navigation";

interface HeroContactActionsProps {
  contacts: Contact[];
}

export function HeroContactActions({ contacts }: HeroContactActionsProps) {
  const router = useRouter();
  const hotline = contacts.find((c) => c.type === "phone");
  const zalo = contacts.find((c) => c.type === "zalo");
  const getCleanValue = (val: string) => val.replace(/\s/g, "");

  const handleAction = (type: string) => {
    // Navigate the current window to thank-you page with source tracking
    router.push(`/thank-you?source=${type}`);
  };

  return (
    <StaggerContainer
      className="grid grid-cols-1 lg:grid-cols-2 gap-2 pt-2 w-full"
      staggerDelay={0.08}
    >
      <StaggerItem className="w-full lg:w-auto" duration={0.25}>
        {hotline ? (
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="w-full gap-2"
          >
            <a
              href={`tel:${getCleanValue(hotline.value)}`}
              onClick={() => handleAction("hotline")}
            >
              {hotline.label || "Số điện thoại"}: {hotline.value}
            </a>
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="lg"
            className="w-full gap-2"
            disabled
          >
            Hotline
          </Button>
        )}
      </StaggerItem>

      <StaggerItem className="w-full lg:w-auto" duration={0.25}>
        {zalo ? (
          <Button asChild variant="default" size="lg" className="w-full gap-2">
            <a
              href={`https://zalo.me/${getCleanValue(zalo.value)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleAction("zalo")}
            >
              {zalo.label || "Zalo"}: {zalo.value}
            </a>
          </Button>
        ) : (
          <Button variant="default" size="lg" className="w-full gap-2" disabled>
            Zalo
          </Button>
        )}
      </StaggerItem>
    </StaggerContainer>
  );
}
