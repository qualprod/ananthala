"use client"

import { PrivacyPolicyForm } from "@/components/admin/privacy-policy-form"
import { Shield } from "lucide-react"

export default function PrivacyPolicyManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5A3C] to-[#6D4530] flex items-center justify-center flex-shrink-0">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Privacy Policy Management</h1>
          <p className="text-foreground/70 mt-1">
            Create and manage your website&apos;s privacy policy. Changes will be reflected on your public privacy policy page.
          </p>
        </div>
      </div>

      <PrivacyPolicyForm />
    </div>
  )
}
