import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/server-context";

export const metadata: Metadata = {
  title: "Account & Data Deletion | OrgFinance",
  description:
    "Request permanent deletion of your OrgFinance account, personal wallet data, and organization associations in compliance with GDPR, CCPA, and App Store guidelines.",
};

export default async function DeleteAccountPage() {
  const { user } = await getAuthContext();
  if (!user) {
    redirect("/auth?next=/profile%23delete-account");
  }
  redirect("/profile#delete-account");
}
