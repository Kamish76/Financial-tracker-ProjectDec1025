# Graph Report - Financial-tracker-ProjectDec1025  (2026-11-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 830 nodes · 3147 edges · 35 communities (29 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0be93b5f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- organization-settings.tsx
- Input
- cn
- next
- [id]/actions.ts
- Database Schema & Policies Document
- member-list.tsx
- createAdminClient
- records/actions.ts
- isWalletOrganization
- database.types.ts
- add-transaction-modal.tsx
- invite-code-manager.tsx
- components.json
- package.json
- compilerOptions
- dependencies
- guards.ts
- finance-client.ts
- guards.test.ts
- server.ts
- PageSkeleton
- finance.ts
- devDependencies
- m4_adversarial_challenge.test.ts
- requireOrgMembership
- scripts
- eslint.config.mjs
- Context & Architecture Routing
- CI Validate Job
- postcss.config.mjs
- styles.d.ts
- empty.ts
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `Button` - 97 edges
2. `createAdminClient()` - 85 edges
3. `cn()` - 82 edges
4. `react` - 70 edges
5. `next` - 61 edges
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
- `Database Keep-Alive Architecture` --references--> `Health Check API Route`  [EXTRACTED]
  README.md → docs/keep-alive-setup-guide.md
- `Changelog Release 1.0.0` --references--> `keep_alive_logs Table`  [EXTRACTED]
  CHANGELOG.md → docs/keep-alive-setup-guide.md
- `Database Keep-Alive Architecture` --references--> `keep_alive_logs Table`  [EXTRACTED]
  README.md → docs/keep-alive-setup-guide.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Keep-Alive Uptime Monitoring Architecture** — readme_database_keep_alive_architecture, docs_keep_alive_setup_guide_health_check_endpoint, docs_keep_alive_setup_guide_keep_alive_logs_table, docs_keep_alive_setup_guide_cron_secret_auth [EXTRACTED 1.00]
- **Multi-Tenant Organization Membership and Authorization Pattern** — docs_database_profiles_table, docs_database_organizations_table, docs_database_organization_members_table, docs_database_fn_has_org_role [EXTRACTED 1.00]
- **User Accountability and Reimbursement Subsystem** — docs_database_transactions_table, docs_database_user_contributions_table, docs_database_reimbursement_requests_table, docs_implementation_summary_balance_calculation_service [EXTRACTED 1.00]

## Communities (35 total, 6 thin omitted)

### Community 0 - "Button"
Cohesion: 0.06
Nodes (90): lucide-react, react, AuthForm(), AuthPage(), signUpWithEmailPassword(), createOrganization(), createWallet(), CreateOrganizationPage() (+82 more)

### Community 1 - "organization-settings.tsx"
Cohesion: 0.08
Nodes (72): deleteTransaction(), updateTransaction(), ChangeRoleDialog(), ChangeRoleDialogProps, DeactivateMemberDialog(), DeactivateMemberDialogProps, MemberCard(), MemberCardProps (+64 more)

### Community 2 - "Input"
Cohesion: 0.11
Nodes (52): AccountsClientProps, CreateAccountSheet(), CreateAccountSheetProps, EditAccountSheet(), EditAccountSheetProps, Category, Transaction, WALLET_TRANSACTION_TYPES (+44 more)

### Community 3 - "cn"
Cohesion: 0.09
Nodes (37): @radix-ui/react-dropdown-menu, @radix-ui/react-separator, AuthenticatedLayout(), AppSidebar(), BrandLogoProps, OrgFinanceLogoMark(), OrgFinanceLogoMarkProps, CardFooter (+29 more)

### Community 4 - "next"
Cohesion: 0.07
Nodes (31): nextConfig, next, @supabase/ssr, fetchHeroStatisticsCached, getHeroStatistics(), HeroStats, AuthCallbackPage(), CallbackInner() (+23 more)

### Community 5 - "[id]/actions.ts"
Cohesion: 0.10
Nodes (31): GET(), runtime, addExpense(), addExpenseForMember(), AddExpenseForMemberInput, AddExpenseInput, addIncome(), addIncomeForMember() (+23 more)

### Community 6 - "Database Schema & Policies Document"
Cohesion: 0.10
Nodes (27): Transaction Category Management, Changelog Release 1.0.0, Changelog Release 1.1.0, Wallet Sub-Accounts Management, fn_has_org_role RLS Helper Function, Invite Codes Table, Organization Members Table, Organizations Table (+19 more)

### Community 7 - "member-list.tsx"
Cohesion: 0.11
Nodes (24): MemberList(), MemberListProps, mapMemberProfiles(), MemberRow, MembersPage(), PageProps, Tabs(), TabsContent() (+16 more)

### Community 8 - "createAdminClient"
Cohesion: 0.19
Nodes (25): createRefund(), deleteInitialTransaction(), createInviteCode(), deactivateMember(), getInviteCodes(), leaveOrganization(), reactivateMember(), revokeInviteCode() (+17 more)

### Community 9 - "records/actions.ts"
Cohesion: 0.18
Nodes (20): fetchOrganizationCategories(), fetchOrganizationMembers(), fetchTransactionAggregates(), fetchTransactions(), fetchTransactionsWithFilters(), Category, Member, OrganizationRecordsView() (+12 more)

### Community 10 - "isWalletOrganization"
Cohesion: 0.15
Nodes (17): DELETE(), PATCH(), RouteContext, POST(), RouteContext, createMirroredWalletTransfer(), AddExpenseSheet(), AddExpenseSheetProps (+9 more)

### Community 11 - "database.types.ts"
Cohesion: 0.09
Nodes (21): Database, Enums, FundedByType, InvitationsTable, InviteCode, Json, KeepAliveLog, KeepAliveStatus (+13 more)

### Community 12 - "add-transaction-modal.tsx"
Cohesion: 0.16
Nodes (16): fetchWalletSummary(), PageProps, RecordsPage(), RecordsPageContent(), RecordsPageContentProps, WalletRecordsView(), loadInitialData(), AddTransactionModal() (+8 more)

### Community 13 - "invite-code-manager.tsx"
Cohesion: 0.18
Nodes (16): InviteCodeManager(), InviteCodeManagerProps, CreateInviteInput, formatCreatedDate(), formatInviteCode(), formatRemainingUses(), getInviteCodeBadge(), getRemainingUses() (+8 more)

### Community 14 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 15 - "package.json"
Cohesion: 0.11
Nodes (18): name, private, version, class-variance-authority, clsx, @radix-ui/react-dialog, @radix-ui/react-select, @radix-ui/react-slot (+10 more)

### Community 16 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 17 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, class-variance-authority, clsx, lucide-react, next, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-select (+9 more)

### Community 18 - "guards.ts"
Cohesion: 0.18
Nodes (13): AccountDeletionPage(), metadata, DeleteAccountPage(), metadata, ActionAuthFailure, ActionAuthResult, ActionAuthSuccess, RequireOptions (+5 more)

### Community 19 - "finance-client.ts"
Cohesion: 0.20
Nodes (12): calculateFilteredStats(), calculatePeriodComparison(), calculatePeriodStats(), calculateTopExpenseCategories(), CategoryBreakdownItem, getPeriodBounds(), getTransactionDate(), pctDelta() (+4 more)

### Community 20 - "guards.test.ts"
Cohesion: 0.14
Nodes (6): @supabase/supabase-js, vitest, admin, __dirname, supabase, testUser

### Community 21 - "server.ts"
Cohesion: 0.27
Nodes (10): DELETE(), DeletionRequestBody, GET(), handleCancellation(), PATCH(), POST(), getSafeRedirect(), signInWithEmailPassword() (+2 more)

### Community 22 - "PageSkeleton"
Cohesion: 0.27
Nodes (7): Loading(), Loading(), Loading(), Loading(), Loading(), Loading(), PageSkeleton()

### Community 23 - "finance.ts"
Cohesion: 0.21
Nodes (10): HoldingsPage(), Props, requireOrgRole(), getOrganizationStats(), MemberBalance, MemberRow, OrganizationStats, ReimbursementRow (+2 more)

### Community 24 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+2 more)

### Community 25 - "m4_adversarial_challenge.test.ts"
Cohesion: 0.32
Nodes (3): MockClassList, ROOT, runScriptWithEnv()

### Community 26 - "requireOrgMembership"
Cohesion: 0.57
Nodes (6): AccountsPage(), Props, requireOrgMembership(), getAccountsWithBalances(), getLinkableOrganizations(), getWalletAccounts()

### Community 27 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 28 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

## Knowledge Gaps
- **18 isolated node(s):** `react-dom`, `tailwindcss`, `@tailwindcss/postcss`, `@types/node`, `@types/react` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 290 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `Button`, `organization-settings.tsx`, `Input`, `cn`, `[id]/actions.ts`, `member-list.tsx`, `createAdminClient`, `records/actions.ts`, `isWalletOrganization`, `add-transaction-modal.tsx`, `package.json`, `guards.ts`, `server.ts`, `finance.ts`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **What connects `react-dom`, `tailwindcss`, `@tailwindcss/postcss` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.06490737038517926 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `organization-settings.tsx`, `Input`, `cn`, `next`, `member-list.tsx`, `records/actions.ts`, `isWalletOrganization`, `add-transaction-modal.tsx`, `invite-code-manager.tsx`, `package.json`, `guards.ts`, `server.ts`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Should `organization-settings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08239700374531835 - nodes in this community are weakly interconnected._
- **Why does `Button` connect `Button` to `organization-settings.tsx`, `Input`, `cn`, `next`, `records/actions.ts`, `isWalletOrganization`, `add-transaction-modal.tsx`, `invite-code-manager.tsx`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `Input` be split into smaller, more focused modules?**
  _Cohesion score 0.10954616588419405 - nodes in this community are weakly interconnected._