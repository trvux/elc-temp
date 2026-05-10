export const CONTACT_TYPES = {
  PHONE: "phone",
  EMAIL: "email",
  ADDRESS: "address",
  FACEBOOK: "facebook",
  ZALO: "zalo",
  YOUTUBE: "youtube",
  TIKTOK: "tiktok",
} as const;

export type ContactType = typeof CONTACT_TYPES[keyof typeof CONTACT_TYPES];

export const SETTINGS_KEYS = {
  SITE_NAME: "site_name",
  SITE_DESCRIPTION: "site_description",
  LOGO_URL: "logo_url",
  FAVICON_URL: "favicon_url",
  FOOTER_TEXT: "footer_text",
} as const;

export type SettingsKey = typeof SETTINGS_KEYS[keyof typeof SETTINGS_KEYS];
