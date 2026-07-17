export interface FooterContact {
  type: string;
  value: string;
}

export function getFooterLogic(
  contacts: FooterContact[] = [],
  year: number = 2026,
  branches: Array<{ address: string }> = []
) {
  const findContact = (type: string) => contacts.find((c) => c.type === type)?.value;

  const phone = findContact("phone") || "";
  const email = findContact("email") || "";
  const address = findContact("address") || branches[0]?.address || "";
  
  const cleanPhone = phone.replace(/\s/g, "");

  const getSocialUrl = (type: "facebook" | "messenger" | "zalo") => {
    const val = findContact(type);
    
    if (!val || val === "#") {
      return type === "zalo" && cleanPhone ? `https://zalo.me/${cleanPhone}` : "#";
    }
    
    if (val.startsWith("http")) return val;
    if (type === "zalo") return `https://zalo.me/${val}`;
    
    return type === "facebook"
      ? `https://facebook.com/${val}`
      : `https://m.me/${val}`;
  };

  return {
    phone,
    email,
    address,
    cleanPhone,
    getSocialUrl,
    currentYear: year,
  };
}
