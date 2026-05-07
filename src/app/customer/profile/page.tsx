"use client"

import type React from "react"
import { useState, useEffect, lazy, Suspense } from "react"
import { User, Mail, Phone, MapPin, Edit2, Trash2, Plus, Check, ExternalLink, Navigation } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CountryCodeSelect } from "@/components/ui/country-code-select"
import { DEFAULT_COUNTRY_CODE } from "@/lib/country-codes"
import { splitPhoneNumber, withCountryCode } from "@/lib/phone"

const GoogleMapsPicker = lazy(() => import("@/components/location/google-maps-picker"))

// Suspense fallback for Maps
function GoogleMapsPickerFallback() {
  return (
    <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  )
}

interface Address {
  _id?: string
  label: string
  houseNumber: string
  crossStreet: string
  locality: string
  landmark?: string
  city: string
  state: string
  pincode: string
  country: string
  isDefault?: boolean
  latitude?: number
  longitude?: number
}

interface UserProfile {
  id: string
  fullname: string
  email: string
  phone: string
  addresses: Address[]
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [phone, setPhone] = useState("")
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [newAddress, setNewAddress] = useState<Address>({
    label: "Home",
    houseNumber: "",
    crossStreet: "",
    locality: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    isDefault: false,
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/customer/profile")
        const data = await response.json()

        if (data.success && data.user) {
          const splitPhone = splitPhoneNumber(data.user.phone || "", DEFAULT_COUNTRY_CODE)
          setUser(data.user)
          setPhone(splitPhone.localNumber)
          setCountryCode(splitPhone.countryCode)
          setAddresses(data.user.addresses || [])
        } else {
          toast.error("Failed to load profile")
        }
      } catch (error) {
        console.error("Profile fetch failed:", error)
        toast.error("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const getGoogleMapsUrl = (address: Address) => {
    if (!address.houseNumber || !address.city || !address.state || !address.pincode) {
      return null
    }
    const query = `${address.houseNumber} ${address.crossStreet} ${address.locality} ${address.city} ${address.state} ${address.pincode}`
    return `https://maps.google.com/?q=${encodeURIComponent(query)}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (addresses.length === 0) {
      toast.error("Please add at least one address")
      return
    }

    setSaving(true)
    try {
      // Remove _id from new addresses without ObjectId format to let MongoDB create them
      const addressesForSave = addresses.map(addr => {
        const addressObj: any = {
          label: addr.label,
          houseNumber: addr.houseNumber,
          crossStreet: addr.crossStreet,
          locality: addr.locality,
          landmark: addr.landmark,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          country: addr.country,
          isDefault: addr.isDefault || false,
          latitude: addr.latitude || null,
          longitude: addr.longitude || null,
        }
        // Only include _id if it's a valid MongoDB ObjectId (24 hex chars)
        if (addr._id && /^[0-9a-f]{24}$/i.test(addr._id)) {
          addressObj._id = addr._id
        }
        return addressObj
      })

      const response = await fetch("/api/customer/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: withCountryCode(`${countryCode}${phone}`, countryCode),
          addresses: addressesForSave,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        setAddresses(data.user.addresses || [])
        setIsEditing(false)
        setShowAddForm(false)
        setEditingAddressIndex(null)
        toast.success("Profile updated successfully!", {
          description: "Your information has been saved.",
        })
      } else {
        toast.error(data.message || "Failed to update profile")
      }
    } catch (error) {
      console.error("Profile update failed:", error)
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleAddAddress = () => {
    if (!newAddress.houseNumber || !newAddress.crossStreet || !newAddress.locality || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast.error("Please fill in all required address fields")
      return
    }

    // Validate pincode format (6 digits)
    if (!/^\d{6}$/.test(newAddress.pincode)) {
      toast.error("Pincode must be 6 digits")
      return
    }

    if (editingAddressIndex !== null) {
      const updatedAddresses = [...addresses]
      updatedAddresses[editingAddressIndex] = newAddress
      setAddresses(updatedAddresses)
      setEditingAddressIndex(null)
    } else {
      if (addresses.length >= 3) {
        toast.error("Maximum 3 addresses allowed")
        return
      }
      setAddresses([...addresses, newAddress])
    }

    setNewAddress({
      label: "Home",
      houseNumber: "",
      crossStreet: "",
      locality: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      isDefault: false,
    })
    setShowAddForm(false)
    toast.success(editingAddressIndex !== null ? "Address updated" : "Address added successfully")
  }

  const handleDeleteAddress = (index: number) => {
    const updatedAddresses = addresses.filter((_, i) => i !== index)
    setAddresses(updatedAddresses)
    toast.success("Address deleted")
  }

  const handleEditAddress = (index: number) => {
    setEditingAddressIndex(index)
    setNewAddress(addresses[index])
    setShowAddForm(true)
  }

  const handleSetDefault = (index: number) => {
    const updatedAddresses = addresses.map((addr, i) => ({
      ...addr,
      isDefault: i === index,
    }))
    setAddresses(updatedAddresses)
    toast.success("Default address updated")
  }

  const handleCancelAddForm = () => {
    setShowAddForm(false)
    setEditingAddressIndex(null)
    setNewAddress({
      label: "Home",
      houseNumber: "",
      crossStreet: "",
      locality: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      isDefault: false,
    })
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleLocationSelect = (locationData: {
    latitude: number
    longitude: number
    houseNumber?: string
    crossStreet?: string
    locality?: string
    city?: string
    state?: string
    pincode?: string
    country?: string
  }) => {
    setNewAddress((prev) => ({
      ...prev,
      houseNumber: locationData.houseNumber || prev.houseNumber,
      crossStreet: locationData.crossStreet || prev.crossStreet,
      locality: locationData.locality || prev.locality,
      city: locationData.city || prev.city,
      state: locationData.state || prev.state,
      pincode: locationData.pincode || prev.pincode,
      country: locationData.country || prev.country || "India",
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    }))
    setShowMapPicker(false)
    toast.success("Location selected! Please review and complete the address details.")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-foreground">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-foreground mt-1">Manage your account information</p>
      </div>

      <Card className="border" style={{ borderColor: "#D9CFC7" }}>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullname" className="text-foreground">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
                <Input
                  id="fullname"
                  value={user?.fullname || ""}
                  disabled
                  className="pl-10 border-[#D9CFC7] bg-gray-50 cursor-not-allowed text-foreground"
                  title="Full name cannot be changed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="pl-10 border-[#D9CFC7] bg-gray-50 cursor-not-allowed text-foreground"
                  title="Email cannot be changed"
                />
              </div>
              <p className="text-xs text-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">
                Phone Number
              </Label>
              <div className="flex gap-2">
                <CountryCodeSelect
                  id="profile-country-code"
                  value={countryCode}
                  onChange={setCountryCode}
                  disabled={!isEditing}
                  className="h-10 w-44 rounded-md border border-[#D9CFC7] bg-white px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:bg-gray-50"
                />
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="pl-10 border-[#D9CFC7] focus-visible:ring-foreground"
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="flex-1 border-[#D9CFC7] text-foreground"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  onClick={handleEdit}
                  className="flex-1 bg-[#EED9C4] hover:bg-[#EED9C4]/80 text-foreground"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border" style={{ borderColor: "#D9CFC7" }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Addresses (Max 3)
            </CardTitle>
            {!showAddForm && addresses.length < 3 && (
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-[#EED9C4] hover:bg-[#EED9C4]/80 text-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showAddForm && (
            <div className="border border-[#D9CFC7] rounded-lg p-4 space-y-4 bg-background">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  {editingAddressIndex !== null ? "Edit Address" : "Add New Address"}
                </h3>
                <Button
                  type="button"
                  onClick={() => setShowMapPicker(true)}
                  variant="outline"
                  className="border-[#D9CFC7] text-foreground"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Pick from Map
                </Button>
              </div>

              {newAddress.latitude && newAddress.longitude && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                  Location coordinates saved: {newAddress.latitude.toFixed(6)}, {newAddress.longitude.toFixed(6)}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label" className="text-foreground">
                    Label
                  </Label>
                  <select
                    id="label"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#D9CFC7] rounded-md focus:outline-none focus:ring-2 focus:ring-foreground bg-background text-foreground"
                  >
                    <option>Home</option>
                    <option>Office</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="houseNumber" className="text-foreground">
                  House/Apartment Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="houseNumber"
                  value={newAddress.houseNumber}
                  onChange={(e) => setNewAddress({ ...newAddress, houseNumber: e.target.value })}
                  placeholder="e.g., 123, Apt 4B"
                  className="border-[#D9CFC7] focus-visible:ring-foreground text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crossStreet" className="text-foreground">
                  Cross Street/Road <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="crossStreet"
                  value={newAddress.crossStreet}
                  onChange={(e) => setNewAddress({ ...newAddress, crossStreet: e.target.value })}
                  placeholder="e.g., Main Street, XYZ Road"
                  className="border-[#D9CFC7] focus-visible:ring-foreground text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="locality" className="text-foreground">
                  Locality/Area <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="locality"
                  value={newAddress.locality}
                  onChange={(e) => setNewAddress({ ...newAddress, locality: e.target.value })}
                  placeholder="e.g., Downtown, Westside"
                  className="border-[#D9CFC7] focus-visible:ring-foreground text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="landmark" className="text-foreground">
                  Landmark (Optional)
                </Label>
                <Input
                  id="landmark"
                  value={newAddress.landmark}
                  onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                  placeholder="e.g., Near City Hospital, Beside Park"
                  className="border-[#D9CFC7] focus-visible:ring-foreground text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-foreground">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    placeholder="Enter city"
                    className="border-[#D9CFC7] focus-visible:ring-foreground text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-foreground">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="state"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    placeholder="Enter state"
                    className="border-[#D9CFC7] focus-visible:ring-foreground text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode" className="text-foreground">
                  Pincode (6 digits) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pincode"
                  value={newAddress.pincode}
                  onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                  placeholder="e.g., 110001"
                  className="border-[#D9CFC7] focus-visible:ring-foreground text-foreground"
                  maxLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-foreground">
                  Country
                </Label>
                <Input
                  id="country"
                  value={newAddress.country}
                  disabled
                  className="border-[#D9CFC7] focus-visible:ring-foreground text-foreground bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAddAddress}
                  className="flex-1 bg-[#EED9C4] hover:bg-[#EED9C4]/80 text-foreground"
                >
                  {editingAddressIndex !== null ? "Update Address" : "Add Address"}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancelAddForm}
                  variant="outline"
                  className="flex-1 border-[#D9CFC7] text-foreground"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {addresses.length === 0 && !showAddForm && (
            <div className="text-center py-8">
              <p className="text-foreground mb-4">No addresses added yet</p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-[#EED9C4] hover:bg-[#EED9C4]/80 text-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Address
              </Button>
            </div>
          )}

          {addresses.map((address, index) => {
            const mapsUrl = getGoogleMapsUrl(address)
            return (
              <div
                key={address._id || index}
                className="border border-[#D9CFC7] rounded-lg p-4 space-y-3 relative bg-background"
              >
                {address.isDefault && (
                  <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                    Default
                  </div>
                )}

                <div className="pr-20">
                  <h3 className="font-semibold text-foreground">{address.label}</h3>
                  <p className="text-sm text-foreground">{address.houseNumber}, {address.crossStreet}</p>
                  <p className="text-sm text-foreground">{address.locality}</p>
                  {address.landmark && <p className="text-sm text-foreground">Landmark: {address.landmark}</p>}
                  <p className="text-sm text-foreground">
                    {address.city}, {address.state} {address.pincode}
                  </p>
                  <p className="text-sm text-foreground">{address.country}</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {mapsUrl && (
                    <Button
                      size="sm"
                      onClick={() => window.open(mapsUrl, "_blank")}
                      variant="outline"
                      className="border-[#D9CFC7] text-foreground"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View on Maps
                    </Button>
                  )}
                  {!address.isDefault && (
                    <Button
                      size="sm"
                      onClick={() => handleSetDefault(index)}
                      variant="outline"
                      className="border-[#D9CFC7] text-foreground"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Set as Default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleEditAddress(index)}
                    variant="outline"
                    className="border-[#D9CFC7] text-foreground"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDeleteAddress(index)}
                    variant="outline"
                    className="border-[#D9CFC7] text-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}

          {addresses.length > 0 && (
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-[#EED9C4] hover:bg-[#EED9C4]/80 text-foreground"
            >
              {saving ? "Saving..." : "Save All Changes"}
            </Button>
          )}
        </CardContent>
      </Card>

      {showMapPicker && (
        <Suspense fallback={<GoogleMapsPickerFallback />}>
          <GoogleMapsPicker
            open={showMapPicker}
            onClose={() => setShowMapPicker(false)}
            onSelectLocation={handleLocationSelect}
            initialLocation={
              newAddress.latitude && newAddress.longitude
                ? { lat: newAddress.latitude, lng: newAddress.longitude }
                : undefined
            }
          />
        </Suspense>
      )}
    </div>
  )
}
