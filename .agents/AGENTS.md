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
- **Default Category Seeding**: When creating a new Personal Wallet organization, automatically seed default preset income/expense categories in `transaction_categories` (in `actions.ts`).
- **No Auto-Seeding on Read/Sync**: Never auto-seed default categories inside read queries (e.g., `getOrganizationCategoriesByType`) or sync pulls. Syncing must strictly mirror what is explicitly stored in the database.
- **Historical Category Label Preservation**: Deleting a category from `transaction_categories` removes the definition for new transactions but preserves text labels on historical transactions.
- **Account Deletion Safeguard**: Never hard-delete a sub-account if it is referenced by any transactions. Require users to archive (`is_active = false`) the account instead. Foreign keys on `transactions.account_id` and `transactions.transfer_to_account_id` enforce `ON DELETE RESTRICT`.

## 3. Middleware & Authentication Redirection Conventions
- **Public Redirect Routes in Middleware**: When adding public-facing redirect or landing pages (such as `/delete-account` or `/account-deletion`) that perform their own authentication state checks or pass destination params, always include them in `publicRoutes` in `src/lib/middleware.ts`. Without this, middleware intercepts unauthenticated requests before they can set intended destination query parameters.
- **Unified Redirect Parameter Detection (`next`, `redirect`, `redirectTo`)**:
  - In login forms (`/auth`), OAuth callback handlers (`/auth/callback`), and server actions (e.g., `signInWithEmailPassword`), always inspect all three redirect parameter names: `searchParams.get('next') || searchParams.get('redirect') || searchParams.get('redirectTo')`.
  - When middleware redirects unauthenticated requests to `/auth`, set both `next` and `redirect` search parameters on the redirect URL so both client forms and callback routes preserve the intended destination.
- **Safe Relative Redirection Guard**: When redirecting post-login, always validate that the target URL is a safe local relative path (`param.startsWith('/') && !param.startsWith('//') && !param.startsWith('/\\')`) before redirecting, defaulting to `/organizations` otherwise to prevent open-redirect vulnerabilities.
- **Static Asset Route Protection**: Never use generic conditions like `pathname.includes('.')` to bypass auth in middleware. Always match against a strict whitelist regex of static asset extensions (e.g. `\.(ico|png|jpg|jpeg|svg|css|js|webp|woff|woff2|ttf|eot)$`).

## 4. PostgREST Filter String Sanitization & Parameterization
- **No Raw Delimiter Interpolation in `.or()` Clauses**: When dynamically constructing Supabase / PostgREST `.or()` filter strings (e.g., multi-column search), never directly interpolate untrusted user input strings into filter templates.
- **Why**: PostgREST uses commas `,`, dots `.`, and parentheses `()` as query control delimiters. An unescaped comma or parenthesis allows attackers to terminate the current clause and inject arbitrary filter operators (e.g., `amount.gt.0`, `is_active.is.false`).
- **Standard**: Always pass search terms through `sanitizePostgrestFilter(term)` to strip delimiter characters `[(),."\\]` prior to interpolation, or implement dedicated parameterized PostgreSQL RPC functions for complex multi-predicate queries.

## 5. Atomic Multi-Step Writes & Stored Procedures
- **No Sequential Multi-Table Round Trips for Critical State**: Critical business operations that span multiple tables or require strict role swap invariants (such as organization ownership transfer, member role mutations, or multi-account ledger transfers) must NEVER be performed via consecutive client-side API/server-action queries.
- **Why**: If an intermediate step fails or encounters a network partition, the database is left in a corrupted or orphaned state (e.g., an organization with no owner or multiple owners).
- **Standard**: Wrap multi-step mutations in a single PostgreSQL stored procedure executed within a transaction boundary with pessimistic row locking (`FOR UPDATE`). For ownership transfer, use `public.transfer_organization_ownership(p_org_id, p_new_owner_id)`.

## 6. Offline-First & Resilient Typography Configuration
- **No Remote Google Font Build Dependencies**: Never import fonts directly from `next/font/google` in Next.js root layouts without local offline fallbacks.
- **Why**: In firewalled, air-gapped, containerized CI/CD runners or offline development environments, remote Google Fonts fetching fails and completely aborts `next build`.
- **Standard**: Define font families using CSS variables (e.g. `--font-geist-sans`, `--font-geist-mono`) backed by system font stacks (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) or vendor self-hosted font files in `public/fonts/`.

## 7. Tailwind CSS v4 Class-Based Dark Mode Synchronization
- **Dual Attribute & Class Synchronization**: In Tailwind CSS v4, dark mode utility classes (`dark:*`) rely on the `.dark` class present on ancestor elements (specifically `<html>` via `@custom-variant dark (&:is(.dark *));`). Setting only `document.documentElement.dataset.theme = 'dark'` does NOT activate Tailwind v4 utility styles.
- **Standard**: Whenever updating the theme in client components or pre-hydration inline scripts, ALWAYS synchronize both:
  ```ts
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  ```
