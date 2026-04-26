"use client"

import { FileText } from "lucide-react"
import { PolicyManagementForm } from "@/components/admin/policy-management-form"

export default function RefundPolicyManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5A3C] to-[#6D4530] flex items-center justify-center flex-shrink-0">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Refund Policy Management</h1>
          <p className="text-foreground/70 mt-1">Create and manage your refund and return policy content.</p>
        </div>
      </div>

      <PolicyManagementForm type="refund" policyLabel="Refund Policy" defaultTitle="Refund & Return Policy" />
    </div>
  )
}
