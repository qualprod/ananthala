import { DEFAULT_NAVIGATION_MENU_ITEMS } from "@/lib/navigation-menu-defaults"
import { HOME_SHOP_PATH } from "@/lib/home-shop-anchor"
import type { Model } from "mongoose"

const ESSENTIALS_HREF = "/category/essentials#shop"
const ESSENTIALS_LABEL = "Curated Essentials"

export async function syncNavigationMenu(NavigationMenu: Model<any>) {
  let menuItems = await NavigationMenu.find().sort({ displayOrder: 1, createdAt: 1 })

  if (menuItems.length === 0) {
    menuItems = await NavigationMenu.insertMany(DEFAULT_NAVIGATION_MENU_ITEMS)
    menuItems = [...menuItems].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
  }

  await NavigationMenu.updateMany(
    { href: "/#find-your-perfect-mattress" },
    { $set: { href: HOME_SHOP_PATH } },
  )

  await NavigationMenu.updateMany(
    {
      label: { $regex: /bedsheets?,\s*pillows?\s*and\s*more/i },
    },
    {
      $set: {
        label: ESSENTIALS_LABEL,
        href: ESSENTIALS_HREF,
        isActive: true,
      },
    },
  )

  const hasEssentialsItem = await NavigationMenu.exists({ href: ESSENTIALS_HREF })
  if (!hasEssentialsItem) {
    await NavigationMenu.updateMany({ displayOrder: { $gte: 5 } }, { $inc: { displayOrder: 1 } })
    await NavigationMenu.create({
      label: ESSENTIALS_LABEL,
      href: ESSENTIALS_HREF,
      displayOrder: 5,
      isActive: true,
    })
  }

  return NavigationMenu.find().sort({ displayOrder: 1, createdAt: 1 })
}
