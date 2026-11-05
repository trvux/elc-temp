import { ServiceWithRelations } from "./types";
import type { ServiceLine } from "./line";
import { primaryImageUrl } from "@/shared/lib/image-asset";

export interface ServiceCardData {
  id: string;
  title: string;
  image: string;
  description: string;
  badges: string[];
  slug: string;
  line: ServiceLine;
  briefPrompts: string[];
}

// Services are sold by quote over Zalo, so a card carries no price: the
// summary and the trust labels are what help someone decide to start a chat.
export function mapServiceToCardData(service: ServiceWithRelations): ServiceCardData {
  return {
    id: service.id,
    title: service.title,
    image: primaryImageUrl(service.images) || "/placeholder.png",
    description: service.description || "",
    badges: service.labels || [],
    slug: service.slug,
    line: service.line,
    briefPrompts: service.briefPrompts,
  };
}
