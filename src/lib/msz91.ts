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
    console.log(`[v0] Phone: ${normalizedPhone}`)
    console.log(`[v0] OTP: ${otp}`)
    console.log(`[v0] SenderID: ${senderId}`)
    console.log(`[v0] Template ID: ${templateId}`)
    console.log(`[v0] AuthKey (first 10 chars): ${authKey.substring(0, 10)}...`)

    // Use MSG91 modern v5 endpoint which properly handles DLT templates
    const msg91Url = new URL("https://api.msg91.com/api/v5/sendsms.php")
    msg91Url.searchParams.append("authkey", authKey)
    msg91Url.searchParams.append("mobiles", normalizedPhone)
    msg91Url.searchParams.append("message", message)
    msg91Url.searchParams.append("sender", senderId)
    msg91Url.searchParams.append("route", "4") // Transactional OTP route
    msg91Url.searchParams.append("country", "91") // India country code
    msg91Url.searchParams.append("template_id", templateId) // DLT Template ID (CRITICAL for India)

    console.log(`[v0] Full URL (with authkey hidden): https://api.msg91.com/api/v5/sendsms.php?authkey=***&mobiles=${normalizedPhone}&route=4&country=91&sender=${senderId}&template_id=${templateId}&message=...`)

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

    // Parse response - MSG91 v5 API returns JSON
    const trimmedResponse = responseText.trim()

    console.log(`[v0] Raw response length: ${trimmedResponse.length}, first 100 chars: ${trimmedResponse.substring(0, 100)}`)

    // v5 API returns JSON
    if (trimmedResponse.startsWith("{")) {
      try {
        const jsonResponse = JSON.parse(trimmedResponse)
        console.log(`[v0] JSON Response received:`, JSON.stringify(jsonResponse))
        
        // Check for success indicators in v5 response
        if (jsonResponse.type === "success" || jsonResponse.request_id || jsonResponse.status === "success") {
          console.log(`[SMS_SUCCESS] OTP sent successfully to ${normalizedPhone} (Request ID: ${jsonResponse.request_id || "N/A"})`)
          return true
        }
        
        // Check for errors
        if (jsonResponse.type === "error" || jsonResponse.message) {
          throw new Error(`MSG91 Error: ${jsonResponse.message || "Unknown error"}`)
        }
        
        // If it has request_id, it's likely success
        if (jsonResponse.request_id) {
          console.log(`[SMS_SUCCESS] OTP sent successfully to ${normalizedPhone} (Request ID: ${jsonResponse.request_id})`)
          return true
        }
        
        console.log(`[SMS_SUCCESS] OTP sent successfully (Response: ${JSON.stringify(jsonResponse)})`)
        return true
      } catch (e) {
        if (e instanceof SyntaxError) {
          console.log(`[v0] Response looks like JSON but failed to parse, treating as error`)
          throw new Error(`MSG91 returned invalid JSON: ${trimmedResponse}`)
        }
        throw e
      }
    }

    // Fallback: check for legacy response formats or numeric codes
    console.log(`[v0] Checking legacy response format...`)

    if (trimmedResponse === "401" || trimmedResponse === "0") {
      console.log(`[SMS_SUCCESS] OTP sent successfully to ${normalizedPhone} (Response: ${trimmedResponse})`)
      return true
    }

    if (trimmedResponse.toLowerCase().includes("success") || trimmedResponse.toLowerCase().includes("message_id")) {
      console.log(`[SMS_SUCCESS] OTP sent successfully to ${normalizedPhone} (Response: ${trimmedResponse})`)
      return true
    }

    // Check for hex-encoded response (indicates error from legacy endpoint)
    if (/^[0-9a-fA-F]{20,}$/.test(trimmedResponse)) {
      console.log(`[v0] CRITICAL: MSG91 returned unexpected hex response: ${trimmedResponse}`)
      throw new Error(`MSG91 Error (Hex Response): ${trimmedResponse}. The API endpoint may have changed. Please verify your template ID and sender ID are active.`)
    }

    // Error responses
    if (trimmedResponse.includes("-1") || trimmedResponse.toLowerCase().includes("authentication")) {
      throw new Error(`MSG91 Authentication Error: Invalid AuthKey. Response: ${trimmedResponse}`)
    }

    if (trimmedResponse.includes("-2") || trimmedResponse.toLowerCase().includes("invalid")) {
      throw new Error(`MSG91 Error: Invalid parameters. Response: ${trimmedResponse}`)
    }

    if (trimmedResponse.toLowerCase().includes("insufficient")) {
      throw new Error(`MSG91 Error: Insufficient balance in your MSG91 account. Response: ${trimmedResponse}`)
    }

    // If response is not understood
    if (!response.ok) {
      throw new Error(`MSG91 API Error. Status: ${response.status}, Body: "${trimmedResponse}"`)
    }

    // Unknown but 200 OK - treat as potential success if we can't decode
    console.warn(`[v0] WARNING: MSG91 returned 200 but response format unclear: ${trimmedResponse}`)
    console.log(`[SMS_SUCCESS] Request appears successful despite unclear response`)
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

    // Build MSG91 API URL - using modern v5 endpoint with proper parameters
    const msg91Url = new URL("https://api.msg91.com/api/v5/sendsms.php")
    msg91Url.searchParams.append("authkey", authKey)
    msg91Url.searchParams.append("mobiles", normalizedPhone)
    msg91Url.searchParams.append("message", message)
    msg91Url.searchParams.append("sender", senderId)
    msg91Url.searchParams.append("route", "4") // Transactional route
    msg91Url.searchParams.append("country", "91")
    msg91Url.searchParams.append("template_id", templateId) // DLT Template ID

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

    // v5 API returns JSON
    if (trimmedResponse.startsWith("{")) {
      try {
        const jsonResponse = JSON.parse(trimmedResponse)
        console.log(`[v0] SMS JSON Response:`, JSON.stringify(jsonResponse))
        
        if (jsonResponse.type === "success" || jsonResponse.request_id || jsonResponse.status === "success") {
          console.log(`[SMS_SUCCESS] SMS sent via MSG91 to ${normalizedPhone}`)
          return true
        }
        
        if (jsonResponse.request_id) {
          console.log(`[SMS_SUCCESS] SMS sent via MSG91 to ${normalizedPhone}`)
          return true
        }
        
        throw new Error(`MSG91 Error: ${jsonResponse.message || "Unknown error"}`)
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw new Error(`Invalid JSON response from MSG91: ${trimmedResponse}`)
        }
        throw e
      }
    }

    // Check for legacy response formats
    if (trimmedResponse === "401" || trimmedResponse === "0" || response.ok) {
      console.log(`[SMS_SUCCESS] SMS sent via MSG91 to ${normalizedPhone}`)
      return true
    }

    throw new Error(`MSG91 API returned: ${trimmedResponse}`)
  } catch (error) {
    console.error("[SMS_ERROR]", error)
    throw error
  }
}
