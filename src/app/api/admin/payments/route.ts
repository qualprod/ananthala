import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Order from "@/models/order"

interface PaymentRecord {
  _id: string
  orderId: string
  customerId: string
  paymentStatus: string
  razorpayPaymentId: string
  totalAmount: number
  createdAt: string
  customerName: string
  customerEmail: string
}

interface PaymentStats {
  totalPayments: number
  completedPayments: number
  failedPayments: number
  pendingPayments: number
  totalPaymentAmount: number
  averagePaymentAmount: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const limit = 10
    const skip = (page - 1) * limit

    await dbConnect()

    // Build filter
    const filter: any = {
      paymentMethod: "razorpay",
      razorpayPaymentId: { $exists: true, $ne: null },
    }

    if (status && status !== "all") {
      filter.paymentStatus = status
    }

    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
        { razorpayPaymentId: { $regex: search, $options: "i" } },
      ]
    }

    // Fetch payments with pagination
    const payments = await Order.find(filter)
      .select(
        "_id orderId customerId customerName customerEmail paymentStatus razorpayPaymentId totalAmount createdAt"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Format payments data
    const formattedPayments = payments.map((payment: any) => ({
      _id: payment._id.toString(),
      orderId: payment.orderId,
      customerId: payment.customerId.toString(),
      customerName: payment.customerName,
      customerEmail: payment.customerEmail,
      paymentStatus: payment.paymentStatus,
      razorpayPaymentId: payment.razorpayPaymentId,
      totalAmount: payment.totalAmount,
      createdAt: new Date(payment.createdAt).toISOString(),
    }))

    // Calculate stats
    const totalPayments = await Order.countDocuments(filter)
    const completedPayments = await Order.countDocuments({
      ...filter,
      paymentStatus: "completed",
    })
    const failedPayments = await Order.countDocuments({
      ...filter,
      paymentStatus: "failed",
    })
    const pendingPayments = await Order.countDocuments({
      ...filter,
      paymentStatus: "pending",
    })

    // Get total and average amount
    const amountStats = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          averageAmount: { $avg: "$totalAmount" },
        },
      },
    ])

    const stats: PaymentStats = {
      totalPayments,
      completedPayments,
      failedPayments,
      pendingPayments,
      totalPaymentAmount: amountStats[0]?.totalAmount || 0,
      averagePaymentAmount: amountStats[0]?.averageAmount || 0,
    }

    return NextResponse.json({
      payments: formattedPayments,
      stats,
      pagination: {
        page,
        limit,
        totalPayments,
        totalPages: Math.ceil(totalPayments / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    )
  }
}
