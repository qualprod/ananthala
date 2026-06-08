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
  const templateId = process.env.MSG91_DLT_TEMPLATE_ID

  if (!authKey || !senderId) {
    throw new Error(
      "MSG91 credentials not configured. Please add MSG91_AUTH_KEY and MSG91_SENDER_ID to your .env.local file.",
    )
  }

  if (!templateId) {
    throw new Error(
      "MSG91 DLT Template ID not configured. Please add MSG91_DLT_TEMPLATE_ID to your .env.local file. Get this from MSG91 → DLT Registration → OTP Template ID.",
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
    const templateId = process.env.MSG91_DLT_TEMPLATE_ID!

    const message = `Your Ananthala OTP is: ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`

    console.log(`[v0] === SENDING OTP VIA MSG91 ===`)
    console.log(`[v0] Original phone: ${phone}, Normalized: ${normalizedPhone}`)
    console.log(`[v0] OTP: ${otp}`)
    console.log(`[v0] SenderID: ${senderId}`)
    console.log(`[v0] Template ID (DLT_TE_ID): ${templateId}`)
    console.log(`[v0] AuthKey (first 10 chars): ${authKey.substring(0, 10)}...`)

    // Use MSG91 correct endpoint - /api/sendhttp.php with correct parameter names
    // Format: https://api.msg91.com/api/sendhttp.php?authkey=XXX&sender=YYY&mobiles=91XXXXXXXXXX&route=4&DLT_TE_ID=ZZZ&message=MSG
    const msg91Url = new URL("https://api.msg91.com/api/sendhttp.php")
    msg91Url.searchParams.append("authkey", authKey)
    msg91Url.searchParams.append("sender", senderId)
    msg91Url.searchParams.append("mobiles", normalizedPhone) // Send with country code (91XXXXXXXXXX)
    msg91Url.searchParams.append("route", "4") // Transactional OTP route
    msg91Url.searchParams.append("DLT_TE_ID", templateId) // CORRECT parameter name for DLT Template ID
    msg91Url.searchParams.append("message", message)

    console.log(`[v0] Full URL (with authkey hidden): https://api.msg91.com/api/sendhttp.php?authkey=***&sender=${senderId}&mobiles=${normalizedPhone}&route=4&DLT_TE_ID=${templateId}&message=...`)

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

    // Parse response - /api/sendhttp.php returns plain text responses
    const trimmedResponse = responseText.trim()

    console.log(`[v0] Raw response length: ${trimmedResponse.length}, first 100 chars: ${trimmedResponse.substring(0, 100)}`)

    // Success responses for sendhttp.php endpoint
    // "401" or "0" = Success
    // Hex string = Message ID (success)
    // Any non-error response with 200 status = usually success
    
    console.log(`[v0] Checking response format...`)

    // Check for numeric success codes
    if (trimmedResponse === "401" || trimmedResponse === "0") {
      console.log(`[SMS_SUCCESS] OTP sent successfully to ${normalizedPhone} (Response: ${trimmedResponse})`)
      return true
    }

    // Check if response is a message ID (hex string without quotes)
    if (/^[0-9a-fA-F]{15,}$/.test(trimmedResponse)) {
      console.log(`[SMS_SUCCESS] OTP sent successfully to ${normalizedPhone} (Message ID: ${trimmedResponse})`)
      return true
    }

    // Check for success keywords
    if (trimmedResponse.toLowerCase().includes("success") || trimmedResponse.toLowerCase().includes("message_id")) {
      console.log(`[SMS_SUCCESS] OTP sent successfully to ${normalizedPhone}`)
      return true
    }

    // If status is 200 and no error indicators, likely success
    if (response.status === 200 && !trimmedResponse.toLowerCase().includes("error") && !trimmedResponse.toLowerCase().includes("invalid")) {
      console.log(`[SMS_SUCCESS] OTP sent successfully to ${normalizedPhone} (Status: 200)`)
      return true
    }

    // Error detection
    if (trimmedResponse.toLowerCase().includes("authentication failed") || trimmedResponse.includes("-1")) {
      throw new Error(`MSG91 Authentication Error: Invalid AuthKey. Response: ${trimmedResponse}`)
    }

    if (trimmedResponse.toLowerCase().includes("invalid") && trimmedResponse.toLowerCase().includes("sender")) {
      throw new Error(`MSG91 Error: Sender ID "${senderId}" is not valid or not registered. Response: ${trimmedResponse}`)
    }

    if (trimmedResponse.toLowerCase().includes("invalid mobile")) {
      throw new Error(`MSG91 Error: Invalid phone number format. Response: ${trimmedResponse}`)
    }

    if (trimmedResponse.toLowerCase().includes("insufficient") || trimmedResponse.toLowerCase().includes("balance")) {
      throw new Error(`MSG91 Error: Insufficient balance in MSG91 account. Response: ${trimmedResponse}`)
    }

    if (trimmedResponse.toLowerCase().includes("template") && trimmedResponse.toLowerCase().includes("invalid")) {
      throw new Error(`MSG91 Error: Template ID "${templateId}" is invalid or not registered. Response: ${trimmedResponse}`)
    }

    // Unknown error response
    if (!response.ok) {
      throw new Error(`MSG91 API Error. Status: ${response.status}, Body: "${trimmedResponse}"`)
    }

    // If we get here with 200 status but unclear response, assume success
    console.warn(`[v0] WARNING: MSG91 returned 200 but response is unclear: ${trimmedResponse}`)
    console.log(`[SMS_SUCCESS] Request completed (unclear response)`)
    return true
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
    const templateId = process.env.MSG91_DLT_TEMPLATE_ID!

    console.log(`[v0] Sending SMS to ${normalizedPhone}`)

    // Build MSG91 API URL - using correct endpoint with proper parameters
    const msg91Url = new URL("https://api.msg91.com/api/sendhttp.php")
    msg91Url.searchParams.append("authkey", authKey)
    msg91Url.searchParams.append("sender", senderId)
    msg91Url.searchParams.append("mobiles", normalizedPhone) // Send with country code (91XXXXXXXXXX)
    msg91Url.searchParams.append("route", "4") // Transactional route
    msg91Url.searchParams.append("DLT_TE_ID", templateId) // CORRECT parameter name for DLT Template ID
    msg91Url.searchParams.append("message", message)

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

    // Check for success indicators
    if (trimmedResponse === "401" || trimmedResponse === "0" || response.status === 200) {
      // Check for error keywords even with 200 status
      if (trimmedResponse.toLowerCase().includes("error") || trimmedResponse.toLowerCase().includes("invalid")) {
        throw new Error(`MSG91 Error: ${trimmedResponse}`)
      }
      console.log(`[SMS_SUCCESS] SMS sent via MSG91 to ${normalizedPhone}`)
      return true
    }

    // Check if response is a message ID (hex string)
    if (/^[0-9a-fA-F]{15,}$/.test(trimmedResponse)) {
      console.log(`[SMS_SUCCESS] SMS sent via MSG91 to ${normalizedPhone}`)
      return true
    }

    throw new Error(`MSG91 API returned: ${trimmedResponse}`)
  } catch (error) {
    console.error("[SMS_ERROR]", error)
    throw error
  }
}
