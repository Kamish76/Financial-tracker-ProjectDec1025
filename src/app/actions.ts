"use server";

import { createAdminClient } from "@/lib/supabase/server";

export interface HeroStats {
  organizationCount: number;
  totalContributions: number;
  transactionCount: number;
  cashOnHand: number;
}

/**
 * Fetches hero statistics for the landing page
 * Returns aggregated data across all organizations
 * Uses admin client since this is public aggregate data for unauthenticated users
 */
export async function getHeroStatistics(): Promise<HeroStats> {
  try {
    // Use admin client to bypass RLS for public statistics
    const supabase = createAdminClient();

    // Get total organization count
    const { count: orgCount, error: orgError } = await supabase
      .from("organizations")
      .select("*", { count: "exact", head: true });

    if (orgError) {
      console.error("Error fetching organization count:", orgError);
    }

    // Get total transaction count
    const { count: txCount, error: txError } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true });

    if (txError) {
      console.error("Error fetching transaction count:", txError);
    }

    // Get member contributions (personal expenses)
    // expense_personal represents out-of-pocket member contributions
    const { data: contributionsData, error: contributionsError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("type", "expense_personal");

    if (contributionsError) {
      console.error("Error fetching contributions:", contributionsError);
    }

    const totalContributions = contributionsData?.reduce(
      (sum, tx) => sum + (tx.amount || 0),
      0
    ) || 0;

    // Calculate cash on hand across all organizations
    // Cash on hand = income - business expenses - held returns (reimbursements)
    const { data: incomeData, error: incomeError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("type", "income");

    const { data: businessExpensesData, error: businessExpError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("type", "expense_business");

    const { data: heldReturnsData, error: heldReturnsError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("type", "held_return");

    if (incomeError || businessExpError || heldReturnsError) {
      console.error("Error fetching cash on hand data:", {
        incomeError,
        businessExpError,
        heldReturnsError,
      });
    }

    const totalIncome = incomeData?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
    const totalBusinessExpenses =
      businessExpensesData?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
    const totalHeldReturns = heldReturnsData?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;

    const cashOnHand = totalIncome - totalBusinessExpenses - totalHeldReturns;

    return {
      organizationCount: orgCount || 0,
      totalContributions,
      transactionCount: txCount || 0,
      cashOnHand,
    };
  } catch (error) {
    console.error("Error in getHeroStatistics:", error);
    // Return fallback values if database query fails
    return {
      organizationCount: 0,
      totalContributions: 0,
      transactionCount: 0,
      cashOnHand: 0,
    };
  }
}
