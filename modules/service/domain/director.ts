// The person shown at the end of every service page. Every field here has a
// source: the title and name were confirmed by the director himself, the award
// is printed on the Daikin Dealer Awards 2023 poster. No degree or years of
// experience are listed because neither has been verified.
import { BASE_URL } from "@/shared/lib/seo-schema";

export const DIRECTOR = {
  name: "Nguyễn Hữu Thấu",
  title: "Giám đốc Điện máy ELC",
  note: "Đại diện ELC nhận giải New Dealer Award tại Daikin Dealer Awards 2023",
  photo: "/images/team/nguyen-huu-thau-avatar.webp",
  initials: "NT",
} as const;

// A small, flat Person that points at the Organization already emitted site
// wide (`/#organization`), so crawlers connect the person to the company.
export function getDirectorSchema() {
  return {
    "@type": "Person",
    "@id": `${BASE_URL}/#director`,
    name: DIRECTOR.name,
    jobTitle: "Giám đốc",
    image: `${BASE_URL}${DIRECTOR.photo}`,
    worksFor: { "@id": `${BASE_URL}/#organization` },
  };
}
