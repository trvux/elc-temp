export interface FooterContact {
  type: string;
  value: string;
}

export interface FooterSettings {
  company_name?: string;
  company_phone?: string;
  company_email?: string;
  company_address?: string;
  company_short_desc?: string;
}

export function getFooterLogic(
  contacts: FooterContact[] = [],
  settings: FooterSettings = {},
  year: number = 2026
) {
  const findContact = (type: string) => contacts.find((c) => c.type === type)?.value;

  const phone = findContact("phone") || settings.company_phone || "";
  const email = findContact("email") || settings.company_email || "";
  const address = settings.company_address || "";
  
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
