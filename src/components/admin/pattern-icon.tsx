import { fabricPatternMap } from "@/data/fabric-patterns"

interface PatternIconProps {
  patternId?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
}

export function PatternIcon({ patternId = "pattern-solid", size = "md", className = "" }: PatternIconProps) {
  const pattern = fabricPatternMap[patternId]

  if (!pattern) {
    return <div className={`${sizeMap[size]} ${className} bg-gray-200 rounded`} />
  }

  const baseSize = sizeMap[size]
  const iconClass = `${baseSize} ${className}`

  // Generate simple SVG icons based on pattern type
  switch (pattern.type) {
    case "solid":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <rect width="24" height="24" fill="#6D4530" />
        </svg>
      )
    case "striped":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="0" y1="0" x2="0" y2="24" />
          <line x1="4" y1="0" x2="4" y2="24" />
          <line x1="8" y1="0" x2="8" y2="24" />
          <line x1="12" y1="0" x2="12" y2="24" />
          <line x1="16" y1="0" x2="16" y2="24" />
          <line x1="20" y1="0" x2="20" y2="24" />
          <line x1="24" y1="0" x2="24" y2="24" />
        </svg>
      )
    case "checkered":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <rect x="0" y="0" width="6" height="6" fill="#6D4530" />
          <rect x="6" y="6" width="6" height="6" fill="#6D4530" />
          <rect x="12" y="0" width="6" height="6" fill="#6D4530" />
          <rect x="18" y="6" width="6" height="6" fill="#6D4530" />
          <rect x="0" y="12" width="6" height="6" fill="#6D4530" />
          <rect x="6" y="18" width="6" height="6" fill="#6D4530" />
          <rect x="12" y="12" width="6" height="6" fill="#6D4530" />
          <rect x="18" y="18" width="6" height="6" fill="#6D4530" />
        </svg>
      )
    case "dotted":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="4" cy="4" r="2" fill="#6D4530" />
          <circle cx="12" cy="4" r="2" fill="#6D4530" />
          <circle cx="20" cy="4" r="2" fill="#6D4530" />
          <circle cx="4" cy="12" r="2" fill="#6D4530" />
          <circle cx="12" cy="12" r="2" fill="#6D4530" />
          <circle cx="20" cy="12" r="2" fill="#6D4530" />
          <circle cx="4" cy="20" r="2" fill="#6D4530" />
          <circle cx="12" cy="20" r="2" fill="#6D4530" />
          <circle cx="20" cy="20" r="2" fill="#6D4530" />
        </svg>
      )
    case "floral":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="3" fill="#6D4530" />
          <circle cx="12" cy="4" r="2" fill="#8B5A3C" opacity="0.7" />
          <circle cx="20" cy="12" r="2" fill="#8B5A3C" opacity="0.7" />
          <circle cx="12" cy="20" r="2" fill="#8B5A3C" opacity="0.7" />
          <circle cx="4" cy="12" r="2" fill="#8B5A3C" opacity="0.7" />
        </svg>
      )
    case "geometric":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" fill="#6D4530" />
        </svg>
      )
    default:
      return (
        <div className={`${sizeMap[size]} ${className} bg-gray-300 rounded`} />
      )
  }
}
