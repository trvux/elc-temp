import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { DIRECTOR, getDirectorSchema } from "@/modules/service/domain/director";
import { toJsonLdHtml } from "@/shared/lib/seo-schema";

// Who stands behind the page. A person and a company, nothing else claimed.
export function ServiceDirectorCard() {
  return (
    <aside
      aria-label="Người đại diện Điện máy ELC"
      className="flex items-center gap-5 border-t border-border pt-8"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLdHtml({ "@context": "https://schema.org", ...getDirectorSchema() }),
        }}
      />
      <Avatar className="size-20">
        <AvatarImage src={DIRECTOR.photo} alt={`${DIRECTOR.name}, ${DIRECTOR.title}`} />
        <AvatarFallback>{DIRECTOR.initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1">
        <p className="type-body-strong">{DIRECTOR.name}</p>
        <p className="type-body-sm text-muted-foreground">{DIRECTOR.title}</p>
        <p className="type-caption text-muted-foreground">{DIRECTOR.note}</p>
      </div>
    </aside>
  );
}
