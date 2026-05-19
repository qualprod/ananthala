import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Coupon from "@/models/Coupons"

/** Public coupons for checkout: active, not expired, under usage cap, not tied to any agent. */
export async function GET() {
  try {
    await dbConnect()

    const now = new Date()

    const coupons = await Coupon.find({
      status: "active",
      expiryDate: { $gte: now },
      $expr: { $lt: ["$usedCount", "$usageLimit"] },
      $or: [{ agents: { $exists: false } }, { agents: { $size: 0 } }],
    })
      .sort({ minPurchase: 1, code: 1 })
      .select("code type discount maxDiscount minPurchase expiryDate")
      .lean()

    const payload = coupons.map((c) => ({
      code: c.code,
      type: c.type,
      discount: c.discount,
      maxDiscount: c.maxDiscount ?? null,
      minPurchase: c.minPurchase,
      expiryDate: c.expiryDate instanceof Date ? c.expiryDate.toISOString() : String(c.expiryDate),
    }))

    return NextResponse.json({ success: true, coupons: payload })
  } catch (error) {
    console.error("Error listing available coupons:", error)
    return NextResponse.json({ success: false, error: "Failed to load coupons" }, { status: 500 })
  }
}
