export const HOME_SHOP_SECTION_ID = "shop"
export const HOME_SHOP_PATH = `/#${HOME_SHOP_SECTION_ID}`
const LEGACY_HOME_SHOP_PATH = "/#find-your-perfect-mattress"

export function isHomeShopHref(href: string) {
  const normalized = href.trim()
  return normalized === HOME_SHOP_PATH || normalized === LEGACY_HOME_SHOP_PATH
}

export function normalizeHomeShopHref(href: string) {
  return isHomeShopHref(href) ? HOME_SHOP_PATH : href
}

export function isHomeShopHash(hash: string) {
  const value = hash.replace(/^#/, "")
  return value === HOME_SHOP_SECTION_ID || value === "find-your-perfect-mattress"
}

export function scrollToHomeShopSection(behavior: ScrollBehavior = "smooth") {
  const element = document.getElementById(HOME_SHOP_SECTION_ID)
  if (!element) return false
  element.scrollIntoView({ behavior })
  return true
}
