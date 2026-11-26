# Graph Report - Financial-tracker-ProjectDec1025  (2026-11-26)

## Corpus Check
- 177 files · ~95,595 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .csv 1)

## Summary
- 930 nodes · 3266 edges · 41 communities (36 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `897d6541`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- wallet-records-view.tsx
- organization-settings.tsx
- cn
- header.tsx
- [id]/actions.ts
- 🚀 Implementation Roadmap
- next
- Vercel Cron Job Keep-Alive Setup Guide
- isWalletOrganization
- [id]/route.ts
- database.types.ts
- org-transaction-modal.tsx
- invite-code-manager.tsx
- components.json
- package.json
- compilerOptions
- dependencies
- guards.ts
- m4_adversarial_challenge.test.ts
- @supabase/supabase-js
- server.ts
- PageSkeleton
- finance.ts
- devDependencies
- hero.tsx
- createAdminClient
- scripts
- eslint.config.mjs
- User Accountability System - Implementation Summary
- Added
- postcss.config.mjs
- styles.d.ts
- empty.ts
- vercel.json
- callback/page.tsx
- Database Schema & Policies (Supabase)
- members/actions.ts
- auth/page.tsx
- theme-toggle.tsx
- GEMINI.md

## God Nodes (most connected - your core abstractions)
1. `Button` - 97 edges
2. `createAdminClient()` - 85 edges
3. `cn()` - 82 edges
4. `react` - 70 edges
5. `next` - 61 edges
6. `lucide-react` - 56 edges
7. `Card` - 49 edges
8. `Input` - 48 edges
9. `CardTitle` - 47 edges
10. `CardContent` - 47 edges

## Surprising Connections (you probably didn't know these)
- `Wallet Sub-Accounts Management` --references--> `AccountsClient()`  [INFERRED]
  CHANGELOG.md → src/app/(authenticated)/organizations/[id]/accounts/accounts-client.tsx
- `Core Platform & Authentication` --references--> `requireOrgMembership()`  [INFERRED]
  CHANGELOG.md → src/lib/auth/guards.ts
- `Recent Enhancements (`wallet-app/setup` Branch)` --references--> `AuthenticatedLayout()`  [INFERRED]
  README.md → src/app/(authenticated)/layout.tsx
- `Financial Statistics & Analytics` --references--> `PeriodStatsCard()`  [INFERRED]
  CHANGELOG.md → src/app/(authenticated)/organizations/[id]/period-stats-card.tsx
- `Financial Statistics & Analytics` --references--> `FilteredStatsCard()`  [INFERRED]
  CHANGELOG.md → src/app/(authenticated)/organizations/[id]/records/filtered-stats-card.tsx

## Import Cycles
- None detected.

## Communities (41 total, 5 thin omitted)

### Community 0 - "Button"
Cohesion: 0.07
Nodes (89): lucide-react, react, CreateOrganizationPage(), AccountsClient(), AccountsClientProps, AddExpenseSheet(), AddExpenseSheetProps, AddIncomeSheet() (+81 more)

### Community 1 - "wallet-records-view.tsx"
Cohesion: 0.07
Nodes (62): Financial Statistics & Analytics, deleteTransaction(), fetchOrganizationCategories(), fetchOrganizationMembers(), fetchTransactionAggregates(), fetchTransactions(), fetchTransactionsWithFilters(), fetchWalletSummary() (+54 more)

### Community 2 - "organization-settings.tsx"
Cohesion: 0.10
Nodes (70): @radix-ui/react-dialog, CreateAccountSheet(), CreateAccountSheetProps, EditAccountSheet(), EditAccountSheetProps, updateTransaction(), ChangeRoleDialog(), ChangeRoleDialogProps (+62 more)

### Community 3 - "cn"
Cohesion: 0.10
Nodes (33): @radix-ui/react-dropdown-menu, AuthenticatedLayout(), AppSidebar(), CardFooter, DropdownMenuCheckboxItem(), DropdownMenuRadioItem(), DropdownMenuShortcut(), DropdownMenuSubContent() (+25 more)

### Community 4 - "header.tsx"
Cohesion: 0.24
Nodes (10): metadata, PrivacyPage(), BrandLogo(), BrandLogoProps, OrgFinanceLogoMarkProps, Footer(), footerLinks, socialLinks (+2 more)

### Community 5 - "[id]/actions.ts"
Cohesion: 0.11
Nodes (36): addExpense(), addExpenseForMember(), AddExpenseForMemberInput, AddExpenseInput, addIncome(), addIncomeForMember(), AddIncomeForMemberInput, AddIncomeInput (+28 more)

### Community 6 - "🚀 Implementation Roadmap"
Cohesion: 0.04
Nodes (46): 1. **Multi-Tenancy (Organizations)**, 3. **Advanced Financial Logic**, 4. **Database Keep-Alive System**, 5. **Modern UI/UX**, Branching Strategy, 🤝 Contributing, 🏗️ Core Architecture: Database Keep-Alive System, **Core Design Principles** (+38 more)

### Community 7 - "next"
Cohesion: 0.16
Nodes (7): nextConfig, next, metadata, authRoutes, publicRoutes, updateSession(), proxy()

### Community 8 - "Vercel Cron Job Keep-Alive Setup Guide"
Cohesion: 0.07
Nodes (28): Cost Analysis, Cron Job Not Running, Current Setup (Free), Daily Execution Flow, Database Still Pausing, Error: "Server configuration error", Error: "Unauthorized", Files Created (+20 more)

### Community 9 - "isWalletOrganization"
Cohesion: 0.26
Nodes (11): 2. **Personal Wallet Mode (Single-Tenant Tracking)**, Recent Enhancements (`wallet-app/setup` Branch), createOrganization(), createWallet(), PageProps, RecordsPage(), SettingsPage(), SettingsPageProps (+3 more)

### Community 10 - "[id]/route.ts"
Cohesion: 0.36
Nodes (6): DELETE(), PATCH(), RouteContext, POST(), RouteContext, assertOrgRoleForAction()

### Community 11 - "database.types.ts"
Cohesion: 0.09
Nodes (21): Database, Enums, FundedByType, InvitationsTable, InviteCode, Json, KeepAliveLog, KeepAliveStatus (+13 more)

### Community 12 - "org-transaction-modal.tsx"
Cohesion: 0.12
Nodes (30): OrgTransactionModalProps, OrgTransactionTab, ManageCategoriesDialog(), ManageCategoriesDialogProps, Category, CategoryDropdown(), CategoryDropdownProps, AddTransactionModal() (+22 more)

### Community 13 - "invite-code-manager.tsx"
Cohesion: 0.07
Nodes (49): InviteCodeManager(), InviteCodeManagerProps, MemberCard(), MemberCardProps, MemberList(), MemberListProps, mapMemberProfiles(), MemberRow (+41 more)

### Community 14 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 15 - "package.json"
Cohesion: 0.11
Nodes (18): name, private, version, class-variance-authority, clsx, @radix-ui/react-select, @radix-ui/react-separator, @radix-ui/react-slot (+10 more)

### Community 16 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 17 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, class-variance-authority, clsx, lucide-react, next, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-select (+9 more)

### Community 18 - "guards.ts"
Cohesion: 0.15
Nodes (15): AccountDeletionPage(), metadata, HoldingsPage(), DeleteAccountPage(), metadata, ActionAuthFailure, ActionAuthResult, ActionAuthSuccess (+7 more)

### Community 19 - "m4_adversarial_challenge.test.ts"
Cohesion: 0.11
Nodes (8): vitest, __dirname, supabase, testUser, MockClassList, ROOT, runScriptWithEnv(), ROOT

### Community 20 - "@supabase/supabase-js"
Cohesion: 0.29
Nodes (4): @supabase/supabase-js, admin, GET(), runtime

### Community 21 - "server.ts"
Cohesion: 0.27
Nodes (9): DELETE(), DeletionRequestBody, GET(), handleCancellation(), PATCH(), POST(), createClient(), getCachedClient (+1 more)

### Community 22 - "PageSkeleton"
Cohesion: 0.27
Nodes (7): Loading(), Loading(), Loading(), Loading(), Loading(), Loading(), PageSkeleton()

### Community 23 - "finance.ts"
Cohesion: 0.25
Nodes (7): Props, MemberBalance, MemberRow, OrganizationStats, ReimbursementRow, Totals, TransactionRow

### Community 24 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+2 more)

### Community 25 - "hero.tsx"
Cohesion: 0.33
Nodes (7): fetchHeroStatisticsCached, getHeroStatistics(), HeroStats, Home(), formatNumber(), Hero(), previewTransactions

### Community 26 - "createAdminClient"
Cohesion: 0.32
Nodes (14): AccountsPage(), Props, requireOrgMembership(), createAdminClient(), createWalletAccount(), deleteWalletAccount(), getAccountsWithBalances(), getLinkableOrganizations() (+6 more)

### Community 27 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 28 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 29 - "User Accountability System - Implementation Summary"
Cohesion: 0.10
Nodes (20): 1. Enhanced Transactions Table, 1. Update Transaction Form, 2. Create User Balance View, 2. New Tables Created, 3. Reimbursement Management, 3. Security & Indexes, 4. Balance Calculation Service, 4. Documentation Updated (+12 more)

### Community 30 - "Added"
Cohesion: 0.10
Nodes (19): [1.0.0] - 2026-01-07, [1.1.0] - 2026-07-29, Added, Added, Added, Category Management System, Changed, Changelog (+11 more)

### Community 35 - "callback/page.tsx"
Cohesion: 0.47
Nodes (4): @supabase/ssr, AuthCallbackPage(), CallbackInner(), supabase

### Community 36 - "Database Schema & Policies (Supabase)"
Cohesion: 0.18
Nodes (10): Applying the Schema, Auth Redirect URIs, Core Tables, Data Integrity & Accountability, Database Schema & Policies (Supabase), Financial Tracking Tables, Notes, RLS Highlights (+2 more)

### Community 37 - "members/actions.ts"
Cohesion: 0.31
Nodes (12): createInviteCode(), deactivateMember(), getInviteCodes(), reactivateMember(), revokeInviteCode(), updateMemberRole(), authorizeOrgAction(), OrganizationSection (+4 more)

### Community 38 - "auth/page.tsx"
Cohesion: 0.42
Nodes (6): getSafeRedirect(), signInWithEmailPassword(), AuthForm(), AuthPage(), signUpWithEmailPassword(), OrgFinanceLogoMark()

### Community 39 - "theme-toggle.tsx"
Cohesion: 0.53
Nodes (5): getServerSnapshot(), getSnapshot(), subscribe(), Theme, ThemeToggle()

## Knowledge Gaps
- **7 isolated node(s):** `react-dom`, `@tailwindcss/postcss`, `@types/node`, `@types/react`, `@types/react-dom` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 379 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `Button`, `wallet-records-view.tsx`, `organization-settings.tsx`, `cn`, `header.tsx`, `[id]/actions.ts`, `isWalletOrganization`, `[id]/route.ts`, `org-transaction-modal.tsx`, `invite-code-manager.tsx`, `package.json`, `guards.ts`, `@supabase/supabase-js`, `server.ts`, `hero.tsx`, `createAdminClient`, `callback/page.tsx`, `members/actions.ts`, `auth/page.tsx`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **What connects `react-dom`, `@tailwindcss/postcss`, `@types/node` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.06611570247933884 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `wallet-records-view.tsx`, `organization-settings.tsx`, `callback/page.tsx`, `cn`, `header.tsx`, `auth/page.tsx`, `theme-toggle.tsx`, `isWalletOrganization`, `org-transaction-modal.tsx`, `invite-code-manager.tsx`, `package.json`, `guards.ts`, `server.ts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `wallet-records-view.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06729264475743349 - nodes in this community are weakly interconnected._
- **Should `organization-settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10073024054982818 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.1036077705827937 - nodes in this community are weakly interconnected._