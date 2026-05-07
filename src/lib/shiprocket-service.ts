// Shiprocket API Service
// Handles all Shiprocket integrations for order tracking and delivery management

interface ShiprocketOrderPayload {
  order_id: string
  order_date: string
  pickup_location_id?: number
  billing_customer_name: string
  billing_email: string
  billing_phone: string
  billing_address: string
  billing_city: string
  billing_state: string
  billing_country: string
  billing_pincode: string
  shipping_is_bill: number
  shipping_customer_name: string
  shipping_email: string
  shipping_phone: string
  shipping_address: string
  shipping_city: string
  shipping_state: string
  shipping_country: string
  shipping_pincode: string
  order_items: Array<{
    name: string
    sku: string
    units: number
    selling_price: number
  }>
  payment_method: string
  sub_total: number
  length?: number
  breadth?: number
  height?: number
  weight: number
}

interface ShiprocketTrackingResponse {
  tracking_data?: {
    shipment_id: number
    order_id: string
    status: string
    status_updates?: Array<{
      status: string
      status_date: string
      location: string
      remarks?: string
    }>
  }
  error?: string
}

class ShiprocketService {
  private apiBaseUrl = "https://api.shiprocket.in/v1/external"
  private token: string | null = null
  private refreshToken: string | null = null
  private tokenExpiry: number | null = null

  constructor() {
    // Use provided API token from environment
    if (process.env.SHIPROCKET_API_TOKEN) {
      this.token = process.env.SHIPROCKET_API_TOKEN
      this.refreshToken = process.env.SHIPROCKET_REFRESH_TOKEN || null
      console.log("[v0] [SHIPROCKET] ✅ API token loaded from environment")
      console.log(`[v0] [SHIPROCKET] Token starts with: ${this.token.substring(0, 30)}...`)
    } else {
      console.warn("[v0] [SHIPROCKET] ⚠️ SHIPROCKET_API_TOKEN not found in environment variables")
      console.warn("[v0] [SHIPROCKET] Available env vars:", Object.keys(process.env).filter(k => k.includes('SHIPROCKET')))
    }
  }

  private async getToken(): Promise<string> {
    // Check if token is cached and valid (with buffer of 5 minutes)
    if (this.token && this.tokenExpiry && Date.now() < (this.tokenExpiry - 5 * 60 * 1000)) {
      return this.token
    }

    // Try to refresh token if refresh token is available and access token expired
    if (this.refreshToken && (!this.token || (this.tokenExpiry && Date.now() >= this.tokenExpiry))) {
      try {
        console.log("[v0] [SHIPROCKET] Attempting to refresh token using refresh token...")
        return await this.refreshAccessToken()
      } catch (refreshError) {
        console.warn("[v0] [SHIPROCKET] Token refresh failed, will use fallback auth:", refreshError)
        // Continue to fallback auth if refresh fails
      }
    }

    // If we have a valid token from environment, use it
    if (this.token && process.env.SHIPROCKET_API_TOKEN) {
      console.log("[v0] [SHIPROCKET] Using provided API token")
      return this.token
    }

    // Fallback: Use email/password authentication if available
    if (process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD) {
      try {
        console.log("[v0] [SHIPROCKET] Using email/password authentication...")
        return await this.authenticateWithCredentials()
      } catch (error) {
        console.error("[v0] [SHIPROCKET] Email/password authentication failed:", error)
        throw new Error("No valid Shiprocket authentication method available. Set SHIPROCKET_API_TOKEN or SHIPROCKET_EMAIL/SHIPROCKET_PASSWORD")
      }
    }

    throw new Error("SHIPROCKET_API_TOKEN not set in environment variables, and no fallback credentials available")
  }

  private async authenticateWithCredentials(): Promise<string> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: process.env.SHIPROCKET_EMAIL,
          password: process.env.SHIPROCKET_PASSWORD,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("[v0] [SHIPROCKET] Auth error response:", data)
        throw new Error(data.message || "Failed to authenticate with Shiprocket")
      }

      if (!data.token) {
        throw new Error("No token received from Shiprocket auth")
      }

      this.token = data.token
      // Token expires in 24 hours, refresh after 23 hours
      this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token
      }
      console.log("[v0] [SHIPROCKET] ✅ Token obtained via credentials successfully")
      return this.token
    } catch (error) {
      console.error("[v0] [SHIPROCKET] Credentials auth error:", error)
      throw error
    }
  }

  private async refreshAccessToken(): Promise<string> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to refresh token")
      }

      if (!data.token) {
        throw new Error("No token received from refresh")
      }

      this.token = data.token
      // Set expiry based on token type (typically 24 hours for access token)
      this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token
      }
      console.log("[v0] [SHIPROCKET] ✅ Token refreshed successfully")
      return this.token
    } catch (error) {
      console.error("[v0] [SHIPROCKET] Token refresh error:", error)
      throw error
    }
  }

  async createOrder(payload: ShiprocketOrderPayload): Promise<any> {
    try {
      console.log("[v0] [SHIPROCKET] Creating order with payload:", JSON.stringify(payload, null, 2))
      
      const token = await this.getToken()
      console.log(`[v0] [SHIPROCKET] Token to be used starts with: ${token.substring(0, 30)}...`)

      const response = await fetch(`${this.apiBaseUrl}/orders/create/adhoc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      console.log(`[v0] [SHIPROCKET] Response status: ${response.status} ${response.statusText}`)
      console.log(`[v0] [SHIPROCKET] Response headers:`, response.headers)
      
      const responseText = await response.text()
      console.log(`[v0] [SHIPROCKET] Response body: ${responseText}`)

      let data
      try {
        data = responseText ? JSON.parse(responseText) : {}
      } catch (parseError) {
        console.error("[v0] [SHIPROCKET] Failed to parse response as JSON:", parseError)
        console.error("[v0] [SHIPROCKET] Raw response:", responseText)
        throw new Error(`Invalid JSON response from Shiprocket: ${responseText || 'Empty response'}`)
      }

      if (!response.ok) {
        console.error("[v0] [SHIPROCKET] Create order error:", JSON.stringify(data, null, 2))
        throw new Error(data.message || data.error || `Failed to create order (${response.status})`)
      }

      console.log("[v0] [SHIPROCKET] Order created successfully:", JSON.stringify(data, null, 2))
      return data
    } catch (error) {
      console.error("[v0] [SHIPROCKET] Create order exception:", error)
      throw error
    }
  }

  async createShipment(orderId: number): Promise<any> {
    try {
      console.log(`[v0] [SHIPROCKET] Creating shipment for Shiprocket order ID: ${orderId}`)
      
      const token = await this.getToken()

      const response = await fetch(
        `${this.apiBaseUrl}/shipments/create/adhoc`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            order_id: orderId,
          }),
        }
      )

      console.log(`[v0] [SHIPROCKET] Shipment response status: ${response.status} ${response.statusText}`)
      
      const responseText = await response.text()
      console.log(`[v0] [SHIPROCKET] Shipment response body: ${responseText}`)

      let data
      try {
        data = responseText ? JSON.parse(responseText) : {}
      } catch (parseError) {
        console.error("[v0] [SHIPROCKET] Failed to parse shipment response as JSON:", parseError)
        console.error("[v0] [SHIPROCKET] Raw shipment response:", responseText)
        throw new Error(`Invalid JSON response from Shiprocket shipment API: ${responseText || 'Empty response'}`)
      }

      if (!response.ok) {
        console.error("[v0] [SHIPROCKET] Create shipment error:", JSON.stringify(data, null, 2))
        throw new Error(data.message || data.error || `Failed to create shipment (${response.status})`)
      }

      console.log("[v0] [SHIPROCKET] Shipment created successfully:", JSON.stringify(data, null, 2))
      return data
    } catch (error) {
      console.error("[v0] [SHIPROCKET] Create shipment exception:", error)
      throw error
    }
  }

  async getTrackingInfo(
    awbCode: string
  ): Promise<ShiprocketTrackingResponse> {
    try {
      const token = await this.getToken()

      const response = await fetch(
        `${this.apiBaseUrl}/tracking/shipments/${awbCode}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.error("[Shiprocket] Tracking error:", data)
        return { error: data.message || "Failed to fetch tracking info" }
      }

      return data
    } catch (error) {
      console.error("[Shiprocket] Tracking exception:", error)
      return { error: "Failed to fetch tracking information" }
    }
  }

  async getOrderDetails(shiprocketOrderId: number): Promise<any> {
    try {
      const token = await this.getToken()

      const response = await fetch(
        `${this.apiBaseUrl}/orders/${shiprocketOrderId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.error("[Shiprocket] Get order details error:", data)
        throw new Error(data.message || "Failed to fetch order details")
      }

      return data
    } catch (error) {
      console.error("[Shiprocket] Get order details exception:", error)
      throw error
    }
  }

  async generatePickupLabel(shipmentId: number): Promise<any> {
    try {
      const token = await this.getToken()

      const response = await fetch(
        `${this.apiBaseUrl}/pickups/generate/label`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            shipment_id: shipmentId,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.error("[Shiprocket] Generate label error:", data)
        throw new Error(data.message || "Failed to generate label")
      }

      return data
    } catch (error) {
      console.error("[Shiprocket] Generate label exception:", error)
      throw error
    }
  }

  async assignCourier(shipmentId: number, courierCompanyId: number): Promise<any> {
    try {
      const token = await this.getToken()

      const response = await fetch(
        `${this.apiBaseUrl}/shipments/assign/courier`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            shipment_id: shipmentId,
            courier_id: courierCompanyId,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.error("[Shiprocket] Assign courier error:", data)
        throw new Error(data.message || "Failed to assign courier")
      }

      return data
    } catch (error) {
      console.error("[Shiprocket] Assign courier exception:", error)
      throw error
    }
  }

  async listCouriers(weight: number, zipCode: string): Promise<any> {
    try {
      const token = await this.getToken()

      const response = await fetch(
        `${this.apiBaseUrl}/couriers/serviceability?weight=${weight}&zip_code=${zipCode}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.error("[Shiprocket] List couriers error:", data)
        throw new Error(data.message || "Failed to list couriers")
      }

      return data
    } catch (error) {
      console.error("[Shiprocket] List couriers exception:", error)
      throw error
    }
  }
}

// Export singleton instance
const shiprocketService = new ShiprocketService()
export default shiprocketService
