"use client"

import { useRef, useState } from "react"
import { X } from "lucide-react"

interface MagnifyImageProps {
  src: string
  alt: string
  zoomSrc?: string
  zoomScale?: number
  className?: string
  imgClassName?: string
}

export function MagnifyImage({
  src,
  alt,
  zoomSrc,
  zoomScale = 1.8,
  className = "",
  imgClassName = "",
}: MagnifyImageProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [isMobileZoomOpen, setIsMobileZoomOpen] = useState(false)
  const [backgroundPosition, setBackgroundPosition] = useState("50% 50%")
  const [mobileScale, setMobileScale] = useState(1)
  const [mobileTranslate, setMobileTranslate] = useState({ x: 0, y: 0 })
  const [pinchStartDistance, setPinchStartDistance] = useState<number | null>(null)
  const [pinchStartScale, setPinchStartScale] = useState(1)
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null)
  const activeZoomSrc = zoomSrc ?? src
  const imageClassName = `object-cover w-full h-full ${imgClassName}`.trim()
  const mobileZoomScale = Math.max(zoomScale, 2)
  const mobileZoomContainerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    const rect = target.getBoundingClientRect()
    const relativeX = ((event.clientX - rect.left) / rect.width) * 100
    const relativeY = ((event.clientY - rect.top) / rect.height) * 100
    setBackgroundPosition(`${relativeX}% ${relativeY}%`)
  }

  const clampScale = (value: number) => Math.min(Math.max(value, 1), 4)

  const clampTranslate = (next: { x: number; y: number }, scale: number) => {
    const container = mobileZoomContainerRef.current
    if (!container) return next

    const maxX = ((scale - 1) * container.clientWidth) / 2
    const maxY = ((scale - 1) * container.clientHeight) / 2

    return {
      x: Math.min(Math.max(next.x, -maxX), maxX),
      y: Math.min(Math.max(next.y, -maxY), maxY),
    }
  }

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.hypot(dx, dy)
  }

  const handleMobileTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      setPinchStartDistance(getTouchDistance(event.touches))
      setPinchStartScale(mobileScale)
      setPanStart(null)
      return
    }

    if (event.touches.length === 1 && mobileScale > 1) {
      const touch = event.touches[0]
      setPanStart({
        x: touch.clientX - mobileTranslate.x,
        y: touch.clientY - mobileTranslate.y,
      })
    }
  }

  const handleMobileTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2 && pinchStartDistance) {
      event.preventDefault()
      const currentDistance = getTouchDistance(event.touches)
      const nextScale = clampScale((currentDistance / pinchStartDistance) * pinchStartScale)
      setMobileScale(nextScale)
      if (nextScale <= 1) {
        setMobileTranslate({ x: 0, y: 0 })
      } else {
        setMobileTranslate((prev) => clampTranslate(prev, nextScale))
      }
      return
    }

    if (event.touches.length === 1 && panStart && mobileScale > 1) {
      event.preventDefault()
      const touch = event.touches[0]
      setMobileTranslate(clampTranslate({
        x: touch.clientX - panStart.x,
        y: touch.clientY - panStart.y,
      }, mobileScale))
    }
  }

  const handleMobileTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length < 2) {
      setPinchStartDistance(null)
    }
    if (event.touches.length === 0) {
      setPanStart(null)
    }
  }

  const openMobileZoom = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setIsMobileZoomOpen(true)
      setMobileScale(mobileZoomScale)
      setMobileTranslate({ x: 0, y: 0 })
      setPinchStartDistance(null)
      setPanStart(null)
    }
  }

  const closeMobileZoom = () => {
    setIsMobileZoomOpen(false)
    setMobileScale(1)
    setMobileTranslate({ x: 0, y: 0 })
    setPinchStartDistance(null)
    setPanStart(null)
  }

  return (
    <>
      <div
        className={`relative aspect-square overflow-hidden ${className}`.trim()}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
        onClick={openMobileZoom}
      >
        <img
          src={src}
          alt={alt}
          className={imageClassName}
          draggable={false}
        />
      </div>
      {isHovering && (
        <>
          <div className="fixed inset-0 z-60 hidden md:block pointer-events-none bg-black/25 backdrop-blur-sm" aria-hidden />
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-70 pointer-events-none rounded-xl border border-[#D9CFC7] bg-white shadow-2xl hidden md:block"
            style={{
              width: "37vw",
              height: "37vw",
              backgroundImage: `url("${activeZoomSrc}")`,
              backgroundPosition,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${zoomScale * 100}%`,
            }}
            aria-hidden
          />
        </>
      )}
      {isMobileZoomOpen && (
        <div className="fixed inset-0 z-80 md:hidden">
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={closeMobileZoom} aria-hidden />
          <div className="relative z-10 h-full w-full flex items-center justify-center p-4">
            <button
              type="button"
              onClick={closeMobileZoom}
              className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-black shadow-lg"
              aria-label="Close zoom preview"
            >
              <X className="h-5 w-5" />
            </button>
            <div
              ref={mobileZoomContainerRef}
              className="relative h-[80vw] w-[80vw] max-h-[80vh] max-w-[80vh] overflow-hidden rounded-xl border border-[#D9CFC7] bg-white shadow-2xl touch-none"
              onTouchStart={handleMobileTouchStart}
              onTouchMove={handleMobileTouchMove}
              onTouchEnd={handleMobileTouchEnd}
            >
              <img
                src={activeZoomSrc}
                alt={`${alt} zoom`}
                draggable={false}
                className="h-full w-full object-cover"
                style={{
                  transform: `translate(${mobileTranslate.x}px, ${mobileTranslate.y}px) scale(${mobileScale})`,
                  transformOrigin: "center center",
                  transition: "transform 0.05s linear",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
