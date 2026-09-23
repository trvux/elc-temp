import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidUrl(url: string) {
  return /^https?:\/\/\S+$/.test(url)
}

export function getUrlFromString(str: string) {
  if (isValidUrl(str)) {
    return str
  }
  try {
    if (str.includes(".") && !str.includes(" ")) {
      return new URL(`https://${str}`).toString()
    }
  } catch {
    return null
  }
  return null
}
