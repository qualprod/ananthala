"use client"

import { useEffect, useState } from "react"

type PolicyType = "privacy" | "terms" | "refund" | "shipping"

interface PolicySection {
  heading: string
  description: string
}

interface PolicyResponse {
  _id?: string
  type: PolicyType
  title: string
  content: string
  sections: PolicySection[]
  lastUpdated?: string
}

interface PolicyPageContentProps {
  type: PolicyType
  fallbackTitle: string
}

export function PolicyPageContent({ type, fallbackTitle }: PolicyPageContentProps) {
  const [policy, setPolicy] = useState<PolicyResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/policies?type=${type}`, { cache: "no-store" })
        const data = await response.json()
        if (data?.success && data?.policy) {
          setPolicy(data.policy)
        } else {
          setPolicy(null)
        }
      } catch (error) {
        console.error(`Failed to load ${type} policy:`, error)
        setPolicy(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPolicy()
  }, [type])

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-8 font-cormorant">{fallbackTitle}</h1>
        <p className="text-lg text-foreground/70">Loading policy...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-8 font-cormorant">
        {policy?.title || fallbackTitle}
      </h1>

      {policy ? (
        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          {policy.content ? (
            <section>
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{policy.content}</p>
            </section>
          ) : null}

          {Array.isArray(policy.sections) &&
            policy.sections.map((section, index) => (
              <section key={`${section.heading}-${index}`}>
                <h2 className="text-2xl font-serif font-cormorant text-foreground mb-4">{section.heading}</h2>
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{section.description}</p>
              </section>
            ))}

          <section className="pt-4 border-t border-border">
            <p className="text-sm text-foreground/70">
              Last Updated:{" "}
              {policy.lastUpdated
                ? new Date(policy.lastUpdated).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </p>
          </section>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border p-6">
          <p className="text-lg text-foreground/80">
            This policy is not configured yet. Please add it from the admin policy API.
          </p>
        </div>
      )}
    </div>
  )
}
