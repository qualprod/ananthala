export interface NavigationMenuDefaultItem {
  label: string
  href: string
  displayOrder: number
  isActive: boolean
}

export const DEFAULT_NAVIGATION_MENU_ITEMS: NavigationMenuDefaultItem[] = [
  { label: "Shop", href: "/#find-your-perfect-mattress", displayOrder: 1, isActive: true },
  { label: "Babies and Kids - Joy", href: "/category/joy#shop", displayOrder: 2, isActive: true },
  { label: "Adults - Bliss", href: "/category/bliss#shop", displayOrder: 3, isActive: true },
  { label: "Seniors - Grace", href: "/category/grace#shop", displayOrder: 4, isActive: true },
  { label: "My Account", href: "/my-account", displayOrder: 5, isActive: true },
  { label: "About Ananthala", href: "/about", displayOrder: 6, isActive: true },
  { label: "Blog", href: "/blog", displayOrder: 7, isActive: true },
  { label: "Search", href: "/search", displayOrder: 8, isActive: true },
]
