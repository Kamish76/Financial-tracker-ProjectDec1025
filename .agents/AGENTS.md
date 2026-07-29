# Financial Tracker - Project Rules & Conventions

## 1. Authentication & Organization Membership Guards
- **Page & Route Handler Authorization**: Never write manual Supabase queries against `organization_members` using `.single()` to verify user access in Next.js pages or route handlers. Always use `await requireOrgMembership(id)` from `@/lib/auth/guards`.
- **Why**: Using `.single()` throws error `PGRST116` if 0 rows match (e.g., an organization owner who lacks a row in `organization_members` or whose row is inactive) or if multiple rows exist, causing false `404 Not Found` or access denied errors.
- **Utility / Server Action Verification**: When writing custom server utilities that check organization access (e.g., `verifyOrgAccess`), always check BOTH:
  1. `organizations.owner_id = userId` using `.maybeSingle()`
  2. `organization_members.user_id = userId AND is_active = true` using `.maybeSingle()`

## 2. Personal Wallet Mode Conventions (`is_wallet = true`)
- **UI Separation**: In Wallet Mode, hide multi-user business features (such as "Quick actions" and "Member balances") and render dedicated Wallet navigation cards ("Wallet Sub Accounts", "Wallet Settings").
- **Default Sub Account Spawning**: When creating a new Personal Wallet organization, automatically spawn a default `'Cash'` sub-account (`starting_value: 0`, `is_active: true`) in `wallet_accounts`.
- **Account Deletion Safeguard**: Never hard-delete a sub-account if it is referenced by any transactions. Require users to archive (`is_active = false`) the account instead.
