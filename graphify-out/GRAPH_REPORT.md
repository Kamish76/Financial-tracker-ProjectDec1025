# Graph Report - Financial-tracker-ProjectDec1025  (2026-11-24)

## Corpus Check
- 177 files · ~95,116 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .example 1, .csv 1)

## Summary
- 831 nodes · 3151 edges · 38 communities (31 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a0fb2184`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- organization-settings.tsx
- lib/utils.ts
- cn
- header.tsx
- [id]/actions.ts
- Database Schema & Policies Document
- next
- org-transaction-modal.tsx
- records/actions.ts
- guards.ts
- database.types.ts
- authorizeOrgAction
- invite-code-manager.tsx
- components.json
- package.json
- compilerOptions
- dependencies
- server-context.ts
- finance-client.ts
- @supabase/supabase-js
- server.ts
- PageSkeleton
- finance.ts
- devDependencies
- hero.tsx
- createAdminClient
- scripts
- eslint.config.mjs
- Context & Architecture Routing
- CI Validate Job
- postcss.config.mjs
- styles.d.ts
- empty.ts
- vercel.json
- callback/page.tsx
- app/layout.tsx
- revalidation.ts

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
- `User Accountability System` --semantically_similar_to--> `User Accountability Schema Enhancement`  [INFERRED] [semantically similar]
  Financial-tracker-ProjectDec1025/README.md → Financial-tracker-ProjectDec1025/docs/implementation-summary.md
- `Changelog Release 1.1.0` --semantically_similar_to--> `Personal Wallet Mode`  [INFERRED] [semantically similar]
  Financial-tracker-ProjectDec1025/CHANGELOG.md → Financial-tracker-ProjectDec1025/README.md
- `Changelog Release 1.0.0` --semantically_similar_to--> `User Accountability System`  [INFERRED] [semantically similar]
  Financial-tracker-ProjectDec1025/CHANGELOG.md → Financial-tracker-ProjectDec1025/README.md
- `AuthenticatedLayout()` --calls--> `requireUser()`  [EXTRACTED]
  Financial-tracker-ProjectDec1025/src/app/(authenticated)/layout.tsx → Financial-tracker-ProjectDec1025/src/lib/auth/guards.ts
- `AccountsClient()` --calls--> `CreateAccountSheet()`  [EXTRACTED]
  Financial-tracker-ProjectDec1025/src/app/(authenticated)/organizations/[id]/accounts/accounts-client.tsx → Financial-tracker-ProjectDec1025/src/app/(authenticated)/organizations/[id]/accounts/create-account-sheet.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Keep-Alive Uptime Monitoring Architecture** — financial_tracker_projectdec1025_readme_database_keep_alive_architecture, financial_tracker_projectdec1025_docs_keep_alive_setup_guide_health_check_endpoint, financial_tracker_projectdec1025_docs_keep_alive_setup_guide_keep_alive_logs_table, financial_tracker_projectdec1025_docs_keep_alive_setup_guide_cron_secret_auth [EXTRACTED 1.00]
- **Multi-Tenant Organization Membership and Authorization Pattern** — financial_tracker_projectdec1025_docs_database_profiles_table, financial_tracker_projectdec1025_docs_database_organizations_table, financial_tracker_projectdec1025_docs_database_organization_members_table, financial_tracker_projectdec1025_docs_database_fn_has_org_role [EXTRACTED 1.00]
- **User Accountability and Reimbursement Subsystem** — financial_tracker_projectdec1025_docs_database_transactions_table, financial_tracker_projectdec1025_docs_database_user_contributions_table, financial_tracker_projectdec1025_docs_database_reimbursement_requests_table, financial_tracker_projectdec1025_docs_implementation_summary_balance_calculation_service [EXTRACTED 1.00]

## Communities (38 total, 7 thin omitted)

### Community 0 - "Button"
Cohesion: 0.07
Nodes (89): lucide-react, react, AuthForm(), AuthPage(), CreateOrganizationPage(), AccountsClient(), AddExpenseSheet(), AddExpenseSheetProps (+81 more)

### Community 1 - "organization-settings.tsx"
Cohesion: 0.07
Nodes (83): deleteTransaction(), updateTransaction(), ChangeRoleDialog(), ChangeRoleDialogProps, DeactivateMemberDialog(), DeactivateMemberDialogProps, MemberCard(), MemberCardProps (+75 more)

### Community 2 - "lib/utils.ts"
Cohesion: 0.10
Nodes (56): AccountsClientProps, CreateAccountSheet(), CreateAccountSheetProps, EditAccountSheet(), EditAccountSheetProps, MemberList(), MemberListProps, Category (+48 more)

### Community 3 - "cn"
Cohesion: 0.10
Nodes (35): @radix-ui/react-dropdown-menu, AuthenticatedLayout(), AppSidebar(), OrgFinanceLogoMark(), CardFooter, DropdownMenuCheckboxItem(), DropdownMenuRadioItem(), DropdownMenuShortcut() (+27 more)

### Community 4 - "header.tsx"
Cohesion: 0.17
Nodes (16): Home(), metadata, PrivacyPage(), BrandLogo(), BrandLogoProps, OrgFinanceLogoMarkProps, Footer(), footerLinks (+8 more)

### Community 5 - "[id]/actions.ts"
Cohesion: 0.12
Nodes (28): addExpenseForMember(), AddExpenseForMemberInput, AddExpenseInput, addIncomeForMember(), AddIncomeForMemberInput, AddIncomeInput, addInitialTransaction(), AddInitialTransactionInput (+20 more)

### Community 6 - "Database Schema & Policies Document"
Cohesion: 0.10
Nodes (27): Transaction Category Management, Changelog Release 1.0.0, Changelog Release 1.1.0, Wallet Sub-Accounts Management, fn_has_org_role RLS Helper Function, Invite Codes Table, Organization Members Table, Organizations Table (+19 more)

### Community 7 - "next"
Cohesion: 0.24
Nodes (6): nextConfig, next, authRoutes, publicRoutes, updateSession(), proxy()

### Community 8 - "org-transaction-modal.tsx"
Cohesion: 0.39
Nodes (7): addExpense(), addIncome(), createRefund(), OrgTransactionModal(), OrgTransactionModalProps, OrgTransactionTab, evaluateMathExpression()

### Community 9 - "records/actions.ts"
Cohesion: 0.16
Nodes (23): fetchOrganizationCategories(), fetchOrganizationMembers(), fetchTransactionAggregates(), fetchTransactions(), fetchTransactionsWithFilters(), fetchWalletSummary(), OrganizationRecordsView(), loadFilters() (+15 more)

### Community 10 - "guards.ts"
Cohesion: 0.14
Nodes (18): DELETE(), PATCH(), RouteContext, POST(), RouteContext, mapMemberProfiles(), MemberRow, MembersPage() (+10 more)

### Community 11 - "database.types.ts"
Cohesion: 0.09
Nodes (21): Database, Enums, FundedByType, InvitationsTable, InviteCode, Json, KeepAliveLog, KeepAliveStatus (+13 more)

### Community 12 - "authorizeOrgAction"
Cohesion: 0.14
Nodes (27): createOrganization(), createWallet(), ManageCategoriesDialog(), ManageCategoriesDialogProps, AddTransactionModal(), AddTransactionModalProps, evaluateMathExpression(), getDisplayBalance() (+19 more)

### Community 13 - "invite-code-manager.tsx"
Cohesion: 0.14
Nodes (24): createInviteCode(), deactivateMember(), getInviteCodes(), reactivateMember(), revokeInviteCode(), updateMemberRole(), InviteCodeManager(), InviteCodeManagerProps (+16 more)

### Community 14 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 15 - "package.json"
Cohesion: 0.10
Nodes (19): name, private, version, class-variance-authority, clsx, @radix-ui/react-dialog, @radix-ui/react-select, @radix-ui/react-separator (+11 more)

### Community 16 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 17 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, class-variance-authority, clsx, lucide-react, next, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-select (+9 more)

### Community 18 - "server-context.ts"
Cohesion: 0.24
Nodes (9): AccountDeletionPage(), metadata, DeleteAccountPage(), metadata, AuthContext, getAuthContext, OrganizationRole, OrgMembership (+1 more)

### Community 19 - "finance-client.ts"
Cohesion: 0.11
Nodes (15): vitest, calculatePeriodComparison(), calculatePeriodStats(), calculateTopExpenseCategories(), CategoryBreakdownItem, getPeriodBounds(), getTransactionDate(), pctDelta() (+7 more)

### Community 20 - "@supabase/supabase-js"
Cohesion: 0.14
Nodes (7): @supabase/supabase-js, admin, __dirname, supabase, testUser, GET(), runtime

### Community 21 - "server.ts"
Cohesion: 0.22
Nodes (11): DELETE(), DeletionRequestBody, GET(), handleCancellation(), PATCH(), POST(), getSafeRedirect(), signInWithEmailPassword() (+3 more)

### Community 22 - "PageSkeleton"
Cohesion: 0.27
Nodes (7): Loading(), Loading(), Loading(), Loading(), Loading(), Loading(), PageSkeleton()

### Community 23 - "finance.ts"
Cohesion: 0.21
Nodes (10): HoldingsPage(), Props, requireOrgRole(), getOrganizationStats(), MemberBalance, MemberRow, OrganizationStats, ReimbursementRow (+2 more)

### Community 24 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+2 more)

### Community 25 - "hero.tsx"
Cohesion: 0.39
Nodes (6): fetchHeroStatisticsCached, getHeroStatistics(), HeroStats, formatNumber(), Hero(), previewTransactions

### Community 26 - "createAdminClient"
Cohesion: 0.33
Nodes (12): AccountsPage(), Props, leaveOrganization(), requireOrgMembership(), getTopCategories(), searchCategories(), createAdminClient(), deleteWalletAccount() (+4 more)

### Community 27 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 28 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 35 - "callback/page.tsx"
Cohesion: 0.47
Nodes (4): @supabase/ssr, AuthCallbackPage(), CallbackInner(), supabase

### Community 37 - "revalidation.ts"
Cohesion: 0.67
Nodes (3): OrganizationSection, revalidateOrganizationOverview(), revalidateOrganizationRecords()

## Knowledge Gaps
- **18 isolated node(s):** `react-dom`, `@tailwindcss/postcss`, `@types/node`, `@types/react`, `@types/react-dom` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 291 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `Button`, `organization-settings.tsx`, `lib/utils.ts`, `cn`, `header.tsx`, `[id]/actions.ts`, `org-transaction-modal.tsx`, `records/actions.ts`, `guards.ts`, `authorizeOrgAction`, `invite-code-manager.tsx`, `package.json`, `server-context.ts`, `@supabase/supabase-js`, `server.ts`, `finance.ts`, `hero.tsx`, `callback/page.tsx`, `app/layout.tsx`, `revalidation.ts`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **What connects `react-dom`, `@tailwindcss/postcss`, `@types/node` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.06584473648557106 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `organization-settings.tsx`, `lib/utils.ts`, `callback/page.tsx`, `cn`, `header.tsx`, `org-transaction-modal.tsx`, `records/actions.ts`, `authorizeOrgAction`, `invite-code-manager.tsx`, `package.json`, `server-context.ts`, `server.ts`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Should `organization-settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06505050505050505 - nodes in this community are weakly interconnected._
- **Why does `Button` connect `Button` to `organization-settings.tsx`, `lib/utils.ts`, `cn`, `header.tsx`, `org-transaction-modal.tsx`, `records/actions.ts`, `authorizeOrgAction`, `invite-code-manager.tsx`, `hero.tsx`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `lib/utils.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09683544303797469 - nodes in this community are weakly interconnected._