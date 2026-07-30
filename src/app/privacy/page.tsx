import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PrivacyPolicyContent } from "@/components/privacy-policy-content";

export const metadata: Metadata = {
  title: "Privacy Policy | OrgFinance",
  description:
    "Learn how OrgFinance protects your multi-tenant financial data, member balances, sub-account audit trails, and personal wallet privacy.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <PrivacyPolicyContent />
      <Footer />
    </>
  );
}
