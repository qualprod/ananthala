"use client"

import { COUNTRY_CODE_OPTIONS, DEFAULT_COUNTRY_CODE } from "@/lib/country-codes"

interface CountryCodeSelectProps {
  id?: string
  name?: string
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
}

export function CountryCodeSelect({
  id = "countryCode",
  name = "countryCode",
  value,
  onChange,
  className,
  disabled = false,
}: CountryCodeSelectProps) {
  return (
    <select
      id={id}
      name={name}
      value={value || DEFAULT_COUNTRY_CODE}
      onChange={(event) => onChange(event.target.value)}
      className={className}
      disabled={disabled}
      aria-label="Country code"
    >
      {COUNTRY_CODE_OPTIONS.map((option) => (
        <option key={`${option.country}-${option.code}`} value={option.code}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
