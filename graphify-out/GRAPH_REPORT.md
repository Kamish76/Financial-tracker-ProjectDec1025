# Graph Report - Financial-tracker-ProjectDec1025  (2026-11-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 810 nodes · 3016 edges · 38 communities (31 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `058432cc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- organization-settings.tsx
- member-list.tsx
- createAdminClient
- react
- cn
- server.ts
- Database Schema & Policies Document
- records/actions.ts
- hero.tsx
- database.types.ts
- invite-code-manager.tsx
- package.json
- components.json
- compilerOptions
- dependencies
- wallet-records-view.tsx
- wallet_transaction_history.test.ts
- requireOrgMembership
- PageSkeleton
- finance_calculations.test.ts
- categories.ts
- finance-client.ts
- devDependencies
- finance.ts
- middleware.ts
- create-test-user.mjs
- scripts
- [id]/route.ts
- records/utils.ts
- eslint.config.mjs
- app/layout.tsx
- Context & Architecture Routing
- CI Validate Job
- postcss.config.mjs
- styles.d.ts
- empty.ts
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `Button` - 97 edges
2. `createAdminClient()` - 86 edges
3. `cn()` - 79 edges
4. `react` - 70 edges
5. `next` - 60 edges
6. `lucide-react` - 56 edges
7. `Card` - 49 edges
8. `Input` - 48 edges
9. `CardContent` - 47 edges
10. `CardTitle` - 47 edges

## Surprising Connections (you probably didn't know these)
- `User Accountability System` --semantically_similar_to--> `User Accountability Schema Enhancement`  [INFERRED] [semantically similar]
  README.md → docs/implementation-summary.md
- `Database Keep-Alive Architecture` --conceptually_related_to--> `Vercel Cron Job Keep-Alive Setup Guide`  [INFERRED]
  README.md → docs/keep-alive-setup-guide.md
- `DropdownMenuCheckboxItem()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/dropdown-menu.tsx → src/lib/utils.ts
- `DropdownMenuRadioItem()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/dropdown-menu.tsx → src/lib/utils.ts
- `DropdownMenuShortcut()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/dropdown-menu.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Keep-Alive Uptime Monitoring Architecture** — readme_database_keep_alive_architecture, docs_keep_alive_setup_guide_health_check_endpoint, docs_keep_alive_setup_guide_keep_alive_logs_table, docs_keep_alive_setup_guide_cron_secret_auth [EXTRACTED 1.00]
- **Multi-Tenant Organization Membership and Authorization Pattern** — docs_database_profiles_table, docs_database_organizations_table, docs_database_organization_members_table, docs_database_fn_has_org_role [EXTRACTED 1.00]
- **User Accountability and Reimbursement Subsystem** — docs_database_transactions_table, docs_database_user_contributions_table, docs_database_reimbursement_requests_table, docs_implementation_summary_balance_calculation_service [EXTRACTED 1.00]

## Communities (38 total, 7 thin omitted)

### Community 0 - "Button"
Cohesion: 0.07
Nodes (78): nextConfig, lucide-react, next, AuthForm(), AuthPage(), signUpWithEmailPassword(), createOrganization(), createWallet() (+70 more)

### Community 1 - "organization-settings.tsx"
Cohesion: 0.10
Nodes (70): CreateAccountSheet(), CreateAccountSheetProps, EditAccountSheet(), EditAccountSheetProps, updateTransaction(), ChangeRoleDialog(), ChangeRoleDialogProps, DeactivateMemberDialog() (+62 more)

### Community 2 - "member-list.tsx"
Cohesion: 0.06
Nodes (57): @radix-ui/react-dropdown-menu, deleteTransaction(), MemberCard(), MemberCardProps, MemberList(), MemberListProps, mapMemberProfiles(), MemberRow (+49 more)

### Community 3 - "createAdminClient"
Cohesion: 0.12
Nodes (41): POST(), RouteContext, addExpense(), addExpenseForMember(), AddExpenseForMemberInput, AddExpenseInput, addIncome(), addIncomeForMember() (+33 more)

### Community 4 - "react"
Cohesion: 0.11
Nodes (30): react, AddExpenseSheet(), AddExpenseSheetProps, AddIncomeSheet(), AddIncomeSheetProps, CustomizableDashboard(), DashboardSection, LayoutConfig (+22 more)

### Community 5 - "cn"
Cohesion: 0.12
Nodes (32): @supabase/ssr, AuthCallbackPage(), CallbackInner(), AuthenticatedLayout(), AppSidebar(), CardFooter, SelectLabel, SelectSeparator (+24 more)

### Community 6 - "server.ts"
Cohesion: 0.10
Nodes (19): @supabase/supabase-js, admin, AccountDeletionPage(), metadata, runtime, HoldingsPage(), DeleteAccountPage(), metadata (+11 more)

### Community 7 - "Database Schema & Policies Document"
Cohesion: 0.10
Nodes (27): Transaction Category Management, Changelog Release 1.0.0, Changelog Release 1.1.0, Wallet Sub-Accounts Management, fn_has_org_role RLS Helper Function, Invite Codes Table, Organization Members Table, Organizations Table (+19 more)

### Community 8 - "records/actions.ts"
Cohesion: 0.15
Nodes (24): fetchOrganizationCategories(), fetchOrganizationMembers(), fetchTransactionAggregates(), fetchTransactions(), fetchTransactionsWithFilters(), fetchWalletSummary(), Category, Member (+16 more)

### Community 9 - "hero.tsx"
Cohesion: 0.14
Nodes (19): fetchHeroStatisticsCached, getHeroStatistics(), HeroStats, Home(), metadata, PrivacyPage(), Footer(), footerLinks (+11 more)

### Community 10 - "database.types.ts"
Cohesion: 0.09
Nodes (21): Database, Enums, FundedByType, InvitationsTable, InviteCode, Json, KeepAliveLog, KeepAliveStatus (+13 more)

### Community 11 - "invite-code-manager.tsx"
Cohesion: 0.18
Nodes (16): InviteCodeManager(), InviteCodeManagerProps, CreateInviteInput, formatCreatedDate(), formatInviteCode(), formatRemainingUses(), getInviteCodeBadge(), getRemainingUses() (+8 more)

### Community 12 - "package.json"
Cohesion: 0.10
Nodes (19): name, private, version, class-variance-authority, clsx, @radix-ui/react-dialog, @radix-ui/react-select, @radix-ui/react-separator (+11 more)

### Community 13 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 14 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 15 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, class-variance-authority, clsx, lucide-react, next, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-select (+9 more)

### Community 16 - "wallet-records-view.tsx"
Cohesion: 0.21
Nodes (13): Category, Transaction, WALLET_TRANSACTION_TYPES, WalletRecordsViewProps, WalletSummary, AddTransactionModal(), AddTransactionModalProps, evaluateMathExpression() (+5 more)

### Community 17 - "wallet_transaction_history.test.ts"
Cohesion: 0.16
Nodes (6): vitest, calculateFilteredStats(), MockClassList, ROOT, runScriptWithEnv(), ROOT

### Community 18 - "requireOrgMembership"
Cohesion: 0.20
Nodes (13): AccountsPage(), Props, SettingsPage(), SettingsPageProps, requireOrgMembership(), createWalletAccount(), deleteWalletAccount(), getAccountsWithBalances() (+5 more)

### Community 19 - "PageSkeleton"
Cohesion: 0.27
Nodes (7): Loading(), Loading(), Loading(), Loading(), Loading(), Loading(), PageSkeleton()

### Community 20 - "finance_calculations.test.ts"
Cohesion: 0.28
Nodes (10): DELETE(), DeletionRequestBody, GET(), handleCancellation(), PATCH(), POST(), getSafeRedirect(), signInWithEmailPassword() (+2 more)

### Community 21 - "categories.ts"
Cohesion: 0.23
Nodes (11): Category, CategoryDropdown(), CategoryDropdownProps, addOrganizationCategory(), deleteOrganizationCategory(), formatCategoryName(), getTopCategories(), getUnlinkedTransactionCategories() (+3 more)

### Community 22 - "finance-client.ts"
Cohesion: 0.31
Nodes (10): calculatePeriodComparison(), calculatePeriodStats(), calculateTopExpenseCategories(), CategoryBreakdownItem, getPeriodBounds(), getTransactionDate(), pctDelta(), PeriodComparison (+2 more)

### Community 23 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+2 more)

### Community 24 - "finance.ts"
Cohesion: 0.25
Nodes (7): Props, MemberBalance, MemberRow, OrganizationStats, ReimbursementRow, Totals, TransactionRow

### Community 25 - "middleware.ts"
Cohesion: 0.32
Nodes (4): authRoutes, publicRoutes, updateSession(), proxy()

### Community 26 - "create-test-user.mjs"
Cohesion: 0.29
Nodes (3): __dirname, supabase, testUser

### Community 27 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 28 - "[id]/route.ts"
Cohesion: 0.53
Nodes (5): DELETE(), PATCH(), RouteContext, assertOrgRoleForAction(), encodeWalletDescription()

### Community 29 - "records/utils.ts"
Cohesion: 0.40
Nodes (3): FetchTransactionsResult, TransactionFilters, FilteredStats

### Community 30 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

## Knowledge Gaps
- **18 isolated node(s):** `react-dom`, `tailwindcss`, `@tailwindcss/postcss`, `@types/node`, `@types/react` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 284 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Button` to `organization-settings.tsx`, `member-list.tsx`, `createAdminClient`, `react`, `cn`, `server.ts`, `records/actions.ts`, `hero.tsx`, `package.json`, `wallet-records-view.tsx`, `requireOrgMembership`, `finance_calculations.test.ts`, `categories.ts`, `middleware.ts`, `[id]/route.ts`, `app/layout.tsx`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **What connects `react-dom`, `tailwindcss`, `@tailwindcss/postcss` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.07493261455525606 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `Button`, `organization-settings.tsx`, `member-list.tsx`, `cn`, `server.ts`, `records/actions.ts`, `hero.tsx`, `invite-code-manager.tsx`, `package.json`, `wallet-records-view.tsx`, `categories.ts`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Should `organization-settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09802631578947368 - nodes in this community are weakly interconnected._
- **Why does `Button` connect `Button` to `organization-settings.tsx`, `member-list.tsx`, `react`, `cn`, `records/actions.ts`, `hero.tsx`, `invite-code-manager.tsx`, `wallet-records-view.tsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Should `member-list.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05955734406438632 - nodes in this community are weakly interconnected._