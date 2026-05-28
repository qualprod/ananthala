/**
 * MSG91 OTP Service Utility
 * Handles all MSG91 SMS/OTP operations
 */

interface MSG91Response {
  type: "success" | "error"
  message: string
  request_id?: string
}

/**
 * Validates MSG91 configuration
 */
export function validateMsg91Config(): void {
  const authKey = process.env.MSG91_AUTH_KEY
  const senderId = process.env.MSG91_SENDER_ID

  if (!authKey || !senderId) {
    throw new Error(
      "MSG91 credentials not configured. Please add MSG91_AUTH_KEY and MSG91_SENDER_ID to your .env.local file.",
    )
  }
}

/**
 * Normalizes and validates phone number
 * Converts to format with country code (91 for India)
 */
export function normalizePhoneNumber(phone: string): string {
  const value = phone.trim()
  const digits = value.replace(/\D/g, "")

  if (digits.length < 6 || digits.length > 15) {
    throw new Error("Invalid phone number. Please provide a valid number with country code.")
  }

  if (value.startsWith("+")) {
    return digits
  }

  if (digits.startsWith("00")) {
    return digits.slice(2)
  }

  // Backward compatibility: local 10-digit numbers default to India.
  if (digits.length === 10) {
    return "91" + digits
  }

  return digits
}

/**
 * Sends OTP via MSG91 API
 */
export async function sendMsg91OTP(phone: string, otp: string): Promise<boolean> {
  try {
    validateMsg91Config()

    const normalizedPhone = normalizePhoneNumber(phone)
    const authKey = process.env.MSG91_AUTH_KEY!
    const senderId = process.env.MSG91_SENDER_ID!

    const message = `Your Ananthala OTP is: ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`

    console.log(`[v0] === SENDING OTP VIA MSG91 ===`)
    console.log(`[v0] Phone: ${normalizedPhone}`)
    console.log(`[v0] OTP: ${otp}`)
    console.log(`[v0] SenderID: ${senderId}`)
    console.log(`[v0] AuthKey (first 10 chars): ${authKey.substring(0, 10)}...`)

    // Use MSG91 correct endpoint - /api/sendhttp.php with all required parameters
    const msg91Url = new URL("https://api.msg91.com/api/sendhttp.php")
    msg91Url.searchParams.append("authkey", authKey)
    msg91Url.searchParams.append("mobiles", normalizedPhone)
    msg91Url.searchParams.append("message", message)
    msg91Url.searchParams.append("sender", senderId)
    msg91Url.searchParams.append("route", "4") // OTP route
    msg91Url.searchParams.append("country", "91") // India country code

    console.log(`[v0] Full URL (with authkey hidden): https://api.msg91.com/api/sendhttp.php?authkey=***&mobiles=${normalizedPhone}&route=4&country=91&sender=${senderId}&message=...`)

    const response = await fetch(msg91Url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    const responseText = await response.text()
    console.log(`[v0] MSG91 Response Status: ${response.status}`)
    console.log(`[v0] MSG91 Response Headers: Content-Type=${response.headers.get("content-type")}`)
    console.log(`[v0] MSG91 Response Body: "${responseText}"`)

    // Parse response - MSG91 returns numeric codes
    const trimmedResponse = responseText.trim()

    // Success indicators based on MSG91 documentation
    // 401 = Success
    // Various numeric responses indicate different statuses
    console.log(`[v0] Checking response...`)

    if (trimmedResponse === "401") {
      console.log(`[SMS_SUCCESS] OTP sent successfully to ${normalizedPhone} (Response: 401)`)
      return true
    }

    if (trimmedResponse.startsWith("0") || trimmedResponse.includes("message_id")) {
      console.log(`[SMS_SUCCESS] OTP sent via MSG91 to ${normalizedPhone} (Response: ${trimmedResponse})`)
      return true
    }

    // Error responses
    if (trimmedResponse.includes("-1") || trimmedResponse.includes("Authentication failed")) {
      throw new Error(`MSG91 Authentication Error: Invalid AuthKey. Response: ${trimmedResponse}`)
    }

    if (trimmedResponse.includes("-2")) {
      throw new Error(`MSG91 Error: Invalid phone number. Response: ${trimmedResponse}`)
    }

    if (trimmedResponse.includes("Invalid sender")) {
      throw new Error(`MSG91 Error: Invalid Sender ID (${senderId}). Response: ${trimmedResponse}`)
    }

    // If response is not understood but request was successful
    if (response.ok && response.status === 200) {
      console.log(`[SMS_SUCCESS] OTP sent via MSG91 to ${normalizedPhone} (Response: ${trimmedResponse})`)
      return true
    }

    // Unknown response
    throw new Error(`MSG91 API returned unexpected response. Status: ${response.status}, Body: "${trimmedResponse}"`)
  } catch (error) {
    console.error("[SMS_ERROR] OTP sending failed:", error)
    throw error
  }
}

/**
 * Sends generic SMS via MSG91 API
 */
export async function sendMsg91SMS(phone: string, message: string): Promise<boolean> {
  try {
    validateMsg91Config()

    const normalizedPhone = normalizePhoneNumber(phone)
    const authKey = process.env.MSG91_AUTH_KEY!
    const senderId = process.env.MSG91_SENDER_ID!

    console.log(`[v0] Sending SMS to ${normalizedPhone}`)

    // Build MSG91 API URL - using correct endpoint with proper parameters
    const msg91Url = new URL("https://api.msg91.com/api/sendhttp.php")
    msg91Url.searchParams.append("authkey", authKey)
    msg91Url.searchParams.append("mobiles", normalizedPhone)
    msg91Url.searchParams.append("message", message)
    msg91Url.searchParams.append("sender", senderId)
    msg91Url.searchParams.append("route", "4") // Transactional route
    msg91Url.searchParams.append("country", "91")

    const response = await fetch(msg91Url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    const responseText = await response.text()
    const trimmedResponse = responseText.trim()

    console.log(`[v0] SMS Response Status: ${response.status}`)
    console.log(`[v0] SMS Response Body: "${trimmedResponse}"`)

    // Check for success
    if (trimmedResponse === "401" || (response.ok && response.status === 200)) {
      console.log(`[SMS_SUCCESS] SMS sent via MSG91 to ${normalizedPhone}`)
      return true
    }

    throw new Error(`MSG91 API returned: ${trimmedResponse}`)
  } catch (error) {
    console.error("[SMS_ERROR]", error)
    throw error
  }
}
