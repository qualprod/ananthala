import { COUNTRY_CODE_OPTIONS, DEFAULT_COUNTRY_CODE } from "@/lib/country-codes"

export function withCountryCode(phone: string, defaultCountryCode = DEFAULT_COUNTRY_CODE): string {
  const value = phone?.trim()
  if (!value) return ""

  const digits = value.replace(/\D/g, "")
  if (!digits) return ""

  if (value.startsWith("+")) {
    return `+${digits}`
  }

  if (digits.startsWith("00")) {
    return `+${digits.slice(2)}`
  }

  if (digits.length === 10) {
    return `${defaultCountryCode}${digits}`
  }

  if (digits.startsWith("91")) {
    return `+${digits}`
  }

  return `+${digits}`
}

const countryCodesByLength = COUNTRY_CODE_OPTIONS.map((item) => item.code).sort((a, b) => b.length - a.length)

export function splitPhoneNumber(phone: string, fallbackCountryCode = DEFAULT_COUNTRY_CODE) {
  const normalized = withCountryCode(phone, fallbackCountryCode)

  if (!normalized) {
    return {
      countryCode: fallbackCountryCode,
      localNumber: "",
    }
  }

  const countryCode = countryCodesByLength.find((code) => normalized.startsWith(code)) || fallbackCountryCode
  const localNumber = normalized.slice(countryCode.length)

  return {
    countryCode,
    localNumber,
  }
}
