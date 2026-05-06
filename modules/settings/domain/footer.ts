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
  facebook_url?: string;
  messenger_url?: string;
  zalo_url?: string;
}

export function getFooterLogic(
  contacts: FooterContact[] = [],
  settings: FooterSettings = {}
) {
  const findContact = (type: string) => contacts.find((c) => c.type === type)?.value;

  const phone = findContact("phone") || settings.company_phone || "0909 411 633";
  const email = findContact("email") || settings.company_email || "contact@elc.com";
  const address = settings.company_address || "06 Dương Quảng Hàm, Phường An Nhơn, Gò Vấp, HCM";
  
  const cleanPhone = phone.replace(/\s/g, "");

  const getSocialUrl = (type: "facebook" | "messenger" | "zalo") => {
    const val = findContact(type) || (settings as any)[`${type}_url`];
    
    if (!val || val === "#") {
      return type === "zalo" ? `https://zalo.me/${cleanPhone}` : "#";
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
    currentYear: new Date().getFullYear(),
  };
}
