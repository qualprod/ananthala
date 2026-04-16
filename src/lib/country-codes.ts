import countries from "world-countries"

export type CountryCodeOption = {
  country: string
  code: string
  label: string
}

const optionsMap = new Map<string, CountryCodeOption>()

countries.forEach((country) => {
  const root = country.idd?.root
  const suffixes = country.idd?.suffixes

  if (!root || !suffixes?.length) return

  suffixes.forEach((suffix) => {
    const code = `${root}${suffix}`
    if (!code.startsWith("+")) return
    if (optionsMap.has(code)) return

    const label = `${country.name.common} (${code})`
    optionsMap.set(code, {
      country: country.name.common,
      code,
      label,
    })
  })
})

export const COUNTRY_CODE_OPTIONS: CountryCodeOption[] = Array.from(optionsMap.values()).sort((a, b) =>
  a.country.localeCompare(b.country),
)

export const DEFAULT_COUNTRY_CODE = "+91"
