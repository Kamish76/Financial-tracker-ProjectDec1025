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

## 3. Middleware & Authentication Redirection Conventions
- **Public Redirect Routes in Middleware**: When adding public-facing redirect or landing pages (such as `/delete-account` or `/account-deletion`) that perform their own authentication state checks or pass destination params, always include them in `publicRoutes` in `src/lib/middleware.ts`. Without this, middleware intercepts unauthenticated requests before they can set intended destination query parameters.
- **Unified Redirect Parameter Detection (`next`, `redirect`, `redirectTo`)**:
  - In login forms (`/auth`), OAuth callback handlers (`/auth/callback`), and server actions (e.g., `signInWithEmailPassword`), always inspect all three redirect parameter names: `searchParams.get('next') || searchParams.get('redirect') || searchParams.get('redirectTo')`.
  - When middleware redirects unauthenticated requests to `/auth`, set both `next` and `redirect` search parameters on the redirect URL so both client forms and callback routes preserve the intended destination.
- **Safe Relative Redirection Guard**: When redirecting post-login, always validate that the target URL is a safe local relative path (`param.startsWith('/') && !param.startsWith('//')`) before redirecting, defaulting to `/organizations` otherwise to prevent open-redirect vulnerabilities.

