# Graph Report - Financial-tracker-ProjectDec1025  (2026-10-19)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 753 nodes · 2773 edges · 30 communities (25 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5e74996d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- member-list.tsx
- organization-settings.tsx
- wallet-records-view.tsx
- cn
- next
- createAdminClient
- invite-code-manager.tsx
- Database Schema & Policies Document
- hero.tsx
- database.types.ts
- components.json
- isWalletOrganization
- categories.ts
- compilerOptions
- package.json
- dependencies
- middleware.ts
- add-transaction-modal.tsx
- devDependencies
- requireOrgMembership
- create-test-user.mjs
- delete-account/route.ts
- scripts
- eslint.config.mjs
- Context & Architecture Routing
- CI Validate Job
- postcss.config.mjs
- styles.d.ts
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `Button` - 85 edges
2. `cn()` - 79 edges
3. `createAdminClient()` - 79 edges
4. `react` - 62 edges
5. `next` - 59 edges
6. `Input` - 54 edges
7. `lucide-react` - 50 edges
8. `Card` - 44 edges
9. `Label` - 44 edges
10. `CardContent` - 42 edges

## Surprising Connections (you probably didn't know these)
- `User Accountability System` --semantically_similar_to--> `User Accountability Schema Enhancement`  [INFERRED] [semantically similar]
  README.md → docs/implementation-summary.md
- `Database Keep-Alive Architecture` --conceptually_related_to--> `Vercel Cron Job Keep-Alive Setup Guide`  [INFERRED]
  README.md → docs/keep-alive-setup-guide.md
- `SelectLabel` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/select.tsx → src/lib/utils.ts
- `SelectSeparator` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/select.tsx → src/lib/utils.ts
- `Database Keep-Alive Architecture` --references--> `Health Check API Route`  [EXTRACTED]
  README.md → docs/keep-alive-setup-guide.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Keep-Alive Uptime Monitoring Architecture** — readme_database_keep_alive_architecture, docs_keep_alive_setup_guide_health_check_endpoint, docs_keep_alive_setup_guide_keep_alive_logs_table, docs_keep_alive_setup_guide_cron_secret_auth [EXTRACTED 1.00]
- **Multi-Tenant Organization Membership and Authorization Pattern** — docs_database_profiles_table, docs_database_organizations_table, docs_database_organization_members_table, docs_database_fn_has_org_role [EXTRACTED 1.00]
- **User Accountability and Reimbursement Subsystem** — docs_database_transactions_table, docs_database_user_contributions_table, docs_database_reimbursement_requests_table, docs_implementation_summary_balance_calculation_service [EXTRACTED 1.00]

## Communities (30 total, 5 thin omitted)

### Community 0 - "Button"
Cohesion: 0.07
Nodes (75): lucide-react, react, AuthForm(), AuthPage(), signUpWithEmailPassword(), CreateOrganizationPage(), AccountsClient(), AccountsClientProps (+67 more)

### Community 1 - "member-list.tsx"
Cohesion: 0.07
Nodes (73): class-variance-authority, reactivateMember(), ChangeRoleDialog(), ChangeRoleDialogProps, DeactivateMemberDialog(), DeactivateMemberDialogProps, MemberCard(), MemberCardProps (+65 more)

### Community 2 - "organization-settings.tsx"
Cohesion: 0.13
Nodes (48): @radix-ui/react-select, CreateAccountSheet(), CreateAccountSheetProps, EditAccountSheet(), EditAccountSheetProps, AddExpenseSheet(), AddExpenseSheetProps, AddIncomeSheet() (+40 more)

### Community 3 - "wallet-records-view.tsx"
Cohesion: 0.07
Nodes (41): DashboardClientWrapperProps, fetchOrganizationCategories(), fetchOrganizationMembers(), fetchTransactionAggregates(), fetchTransactions(), fetchTransactionsWithFilters(), fetchWalletSummary(), Category (+33 more)

### Community 4 - "cn"
Cohesion: 0.11
Nodes (32): @radix-ui/react-dropdown-menu, @radix-ui/react-separator, AuthenticatedLayout(), AppSidebar(), CardFooter, DropdownMenuCheckboxItem(), DropdownMenuRadioItem(), DropdownMenuShortcut() (+24 more)

### Community 5 - "next"
Cohesion: 0.08
Nodes (27): nextConfig, next, @supabase/supabase-js, admin, AccountDeletionPage(), metadata, runtime, DELETE() (+19 more)

### Community 6 - "createAdminClient"
Cohesion: 0.14
Nodes (35): addExpense(), addExpenseForMember(), AddExpenseForMemberInput, AddExpenseInput, addIncome(), addIncomeForMember(), AddIncomeForMemberInput, AddIncomeInput (+27 more)

### Community 7 - "invite-code-manager.tsx"
Cohesion: 0.14
Nodes (24): createInviteCode(), getInviteCodes(), revokeInviteCode(), InviteCodeManager(), InviteCodeManagerProps, OrganizationSection, revalidateOrganizationMembers(), revalidateOrganizationOverview() (+16 more)

### Community 8 - "Database Schema & Policies Document"
Cohesion: 0.10
Nodes (27): Transaction Category Management, Changelog Release 1.0.0, Changelog Release 1.1.0, Wallet Sub-Accounts Management, fn_has_org_role RLS Helper Function, Invite Codes Table, Organization Members Table, Organizations Table (+19 more)

### Community 9 - "hero.tsx"
Cohesion: 0.14
Nodes (18): getHeroStatistics(), HeroStats, Home(), metadata, PrivacyPage(), Footer(), footerLinks, socialLinks (+10 more)

### Community 10 - "database.types.ts"
Cohesion: 0.09
Nodes (21): Database, Enums, FundedByType, InvitationsTable, InviteCode, Json, KeepAliveLog, KeepAliveStatus (+13 more)

### Community 11 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 12 - "isWalletOrganization"
Cohesion: 0.20
Nodes (13): PATCH(), RouteContext, createOrganization(), createWallet(), MembersPage(), PageProps, SettingsPage(), SettingsPageProps (+5 more)

### Community 13 - "categories.ts"
Cohesion: 0.21
Nodes (15): ManageCategoriesDialog(), ManageCategoriesDialogProps, Category, CategoryDropdown(), CategoryDropdownProps, addOrganizationCategory(), deleteOrganizationCategory(), formatCategoryName() (+7 more)

### Community 14 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 15 - "package.json"
Cohesion: 0.11
Nodes (17): name, private, version, clsx, @radix-ui/react-dialog, @radix-ui/react-slot, @radix-ui/react-tabs, @radix-ui/react-tooltip (+9 more)

### Community 16 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, class-variance-authority, clsx, lucide-react, next, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-select (+9 more)

### Community 17 - "middleware.ts"
Cohesion: 0.15
Nodes (10): @supabase/ssr, getSafeRedirect(), signInWithEmailPassword(), AuthCallbackPage(), CallbackInner(), authRoutes, publicRoutes, updateSession() (+2 more)

### Community 18 - "add-transaction-modal.tsx"
Cohesion: 0.25
Nodes (10): AddTransactionModal(), AddTransactionModalProps, evaluateMathExpression(), getDisplayBalance(), TabType, WalletFabProps, addWalletTransaction(), AddWalletTransactionInput (+2 more)

### Community 19 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tw-animate-css, @types/node, @types/react (+3 more)

### Community 20 - "requireOrgMembership"
Cohesion: 0.36
Nodes (8): AccountsPage(), Props, requireOrgMembership(), deleteWalletAccount(), getAccountsWithBalances(), getWalletAccounts(), sanitizePostgrestFilter(), verifyOrgAccess()

### Community 21 - "create-test-user.mjs"
Cohesion: 0.20
Nodes (4): vitest, __dirname, supabase, testUser

### Community 22 - "delete-account/route.ts"
Cohesion: 0.18
Nodes (3): DeletionRequestBody, mockDeletionRequests, metadata

### Community 23 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 24 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

## Knowledge Gaps
- **19 isolated node(s):** `react-dom`, `tailwindcss`, `@tailwindcss/postcss`, `tw-animate-css`, `@types/node` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 283 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `Button`, `member-list.tsx`, `organization-settings.tsx`, `wallet-records-view.tsx`, `cn`, `invite-code-manager.tsx`, `hero.tsx`, `isWalletOrganization`, `categories.ts`, `package.json`, `middleware.ts`, `add-transaction-modal.tsx`, `requireOrgMembership`, `delete-account/route.ts`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **What connects `react-dom`, `tailwindcss`, `@tailwindcss/postcss` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.07326007326007326 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `member-list.tsx`, `organization-settings.tsx`, `wallet-records-view.tsx`, `cn`, `next`, `invite-code-manager.tsx`, `hero.tsx`, `categories.ts`, `package.json`, `middleware.ts`, `add-transaction-modal.tsx`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Should `member-list.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.067926455566905 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Button` to `member-list.tsx`, `organization-settings.tsx`, `wallet-records-view.tsx`, `cn`, `invite-code-manager.tsx`, `hero.tsx`, `categories.ts`, `package.json`, `add-transaction-modal.tsx`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `organization-settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13286713286713286 - nodes in this community are weakly interconnected._