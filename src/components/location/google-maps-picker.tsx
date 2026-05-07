"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { MapPin, Search, Loader2, Navigation, X } from "lucide-react"
import { toast } from "sonner"

interface LocationData {
  latitude: number
  longitude: number
  houseNumber?: string
  crossStreet?: string
  locality?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  formattedAddress?: string
}

interface GoogleMapsPickerProps {
  open: boolean
  onClose: () => void
  onSelectLocation: (location: LocationData) => void
  initialLocation?: { lat: number; lng: number }
}

const mapContainerStyle = {
  width: "100%",
  height: "400px",
}

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
}

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"]

export default function GoogleMapsPicker({
  open,
  onClose,
  onSelectLocation,
  initialLocation,
}: GoogleMapsPickerProps) {
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [mapCenter, setMapCenter] = useState(initialLocation || defaultCenter)
  const mapRef = useRef<google.maps.Map | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [apiKeyMissing, setApiKeyMissing] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!apiKey) {
      console.error("[v0] Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.")
      setApiKeyMissing(true)
    }
  }, [apiKey])

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
    libraries,
    preventGoogleFontsLoading: true,
  })

  useEffect(() => {
    if (isLoaded && searchInputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
        componentRestrictions: { country: "in" },
        fields: ["address_components", "geometry", "formatted_address"],
      })

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current?.getPlace()
        if (place?.geometry?.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          setSelectedPosition({ lat, lng })
          setMapCenter({ lat, lng })
          mapRef.current?.panTo({ lat, lng })
          mapRef.current?.setZoom(17)
          parseAddressComponents(place.address_components || [], lat, lng, place.formatted_address)
        }
      })
    }
  }, [isLoaded, open])

  const parseAddressComponents = useCallback(
    (
      components: google.maps.GeocoderAddressComponent[],
      lat: number,
      lng: number,
      formattedAddress?: string
    ) => {
      const locationInfo: LocationData = {
        latitude: lat,
        longitude: lng,
        formattedAddress: formattedAddress || "",
      }

      for (const component of components) {
        const types = component.types

        if (types.includes("street_number") || types.includes("premise")) {
          locationInfo.houseNumber = component.long_name
        }
        if (types.includes("route") || types.includes("street_address")) {
          locationInfo.crossStreet = component.long_name
        }
        if (types.includes("sublocality_level_1") || types.includes("sublocality") || types.includes("neighborhood")) {
          locationInfo.locality = component.long_name
        }
        if (types.includes("locality") || types.includes("administrative_area_level_3")) {
          locationInfo.city = component.long_name
        }
        if (types.includes("administrative_area_level_1")) {
          locationInfo.state = component.long_name
        }
        if (types.includes("postal_code")) {
          locationInfo.pincode = component.long_name
        }
        if (types.includes("country")) {
          locationInfo.country = component.long_name
        }
      }

      setLocationData(locationInfo)
    },
    []
  )

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      if (!isLoaded) return

      try {
        const geocoder = new google.maps.Geocoder()
        const response = await geocoder.geocode({ location: { lat, lng } })

        if (response.results && response.results.length > 0) {
          const result = response.results[0]
          parseAddressComponents(
            result.address_components,
            lat,
            lng,
            result.formatted_address
          )
        }
      } catch (error) {
        console.error("Reverse geocoding error:", error)
        setLocationData({
          latitude: lat,
          longitude: lng,
        })
      }
    },
    [isLoaded, parseAddressComponents]
  )

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        setSelectedPosition({ lat, lng })
        reverseGeocode(lat, lng)
      }
    },
    [reverseGeocode]
  )

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim() || !isLoaded) return

    setIsSearching(true)
    try {
      const geocoder = new google.maps.Geocoder()
      const response = await geocoder.geocode({
        address: searchQuery,
        componentRestrictions: { country: "in" },
      })

      if (response.results && response.results.length > 0) {
        const result = response.results[0]
        const location = result.geometry.location
        const lat = location.lat()
        const lng = location.lng()

        setSelectedPosition({ lat, lng })
        setMapCenter({ lat, lng })
        mapRef.current?.panTo({ lat, lng })
        mapRef.current?.setZoom(17)
        parseAddressComponents(result.address_components, lat, lng, result.formatted_address)
      } else {
        toast.error("Location not found")
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      toast.error("Failed to search location")
    } finally {
      setIsSearching(false)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        setSelectedPosition({ lat, lng })
        setMapCenter({ lat, lng })
        mapRef.current?.panTo({ lat, lng })
        mapRef.current?.setZoom(17)
        reverseGeocode(lat, lng)
        setIsGettingLocation(false)
      },
      (error) => {
        console.error("Geolocation error:", error)
        toast.error("Failed to get your current location. Please enable location access.")
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const handleConfirmLocation = () => {
    if (!selectedPosition || !locationData) {
      toast.error("Please select a location on the map")
      return
    }

    onSelectLocation(locationData)
    onClose()
  }

  if (apiKeyMissing) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Maps Configuration Error</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-medium mb-2">Google Maps API Key Not Configured</p>
              <p className="text-sm text-red-600 mb-3">
                The Google Maps feature requires an API key to function properly.
              </p>
              <p className="text-xs text-gray-600">
                Please contact support to enable this feature, or manually enter your address details.
              </p>
            </div>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (loadError) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Error Loading Maps</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-medium mb-2">Failed to Load Google Maps</p>
              <p className="text-sm text-red-600">
                {loadError?.message || "An error occurred while loading Google Maps. Please try again later."}
              </p>
            </div>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Location on Map
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a location..."
                className="pl-10 border-[#D9CFC7] focus-visible:ring-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !isLoaded}
              className="bg-[#EED9C4] hover:bg-[#EED9C4]/80 text-foreground"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          <Button
            onClick={getCurrentLocation}
            disabled={isGettingLocation || !isLoaded}
            variant="outline"
            className="w-full border-[#D9CFC7] text-foreground"
          >
            {isGettingLocation ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4 mr-2" />
            )}
            Use My Current Location
          </Button>

          {!isLoaded ? (
            <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden border border-[#D9CFC7]">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={selectedPosition ? 17 : 5}
                onClick={onMapClick}
                onLoad={onMapLoad}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: true,
                  zoomControl: true,
                }}
              >
                {selectedPosition && (
                  <Marker
                    position={selectedPosition}
                    draggable
                    onDragEnd={(e) => {
                      if (e.latLng) {
                        const lat = e.latLng.lat()
                        const lng = e.latLng.lng()
                        setSelectedPosition({ lat, lng })
                        reverseGeocode(lat, lng)
                      }
                    }}
                  />
                )}
              </GoogleMap>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Click on the map to select a location, or drag the marker to adjust the position.
          </p>

          {locationData && (
            <div className="border border-[#D9CFC7] rounded-lg p-4 bg-muted/30">
              <h4 className="font-semibold text-foreground mb-2">Selected Address:</h4>
              <p className="text-sm text-foreground">
                {locationData.formattedAddress || "Address details will be filled in the form"}
              </p>
              {locationData.latitude && locationData.longitude && (
                <p className="text-xs text-muted-foreground mt-1">
                  Coordinates: {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#D9CFC7] text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLocation}
            disabled={!selectedPosition || !locationData}
            className="bg-[#EED9C4] hover:bg-[#EED9C4]/80 text-foreground"
          >
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
