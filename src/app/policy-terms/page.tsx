import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PolicyPageContent } from "@/components/policy/policy-page-content"

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16 px-4">
        <PolicyPageContent type="terms" fallbackTitle="Terms & Conditions" />
      </main>
      <Footer />
    </div>
  )
}
