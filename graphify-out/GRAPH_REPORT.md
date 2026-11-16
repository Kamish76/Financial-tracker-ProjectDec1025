# Graph Report - Financial-tracker-ProjectDec1025  (2026-10-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 756 nodes · 2793 edges · 30 communities (24 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `990838c3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- react
- member-card.tsx
- next
- cn
- invite-code-manager.tsx
- createAdminClient
- Database Schema & Policies Document
- hero.tsx
- records/actions.ts
- categories.ts
- database.types.ts
- components.json
- package.json
- compilerOptions
- dependencies
- guards.ts
- requireOrgMembership
- members/actions.ts
- devDependencies
- create-test-user.mjs
- m4_adversarial_challenge.test.ts
- scripts
- eslint.config.mjs
- Context & Architecture Routing
- CI Validate Job
- postcss.config.mjs
- styles.d.ts
- empty.ts
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `Button` - 85 edges
2. `createAdminClient()` - 81 edges
3. `cn()` - 79 edges
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

## Communities (30 total, 6 thin omitted)

### Community 0 - "Button"
Cohesion: 0.07
Nodes (74): lucide-react, AuthForm(), AuthPage(), createOrganization(), createWallet(), CreateOrganizationPage(), AccountsClient(), AccountsClientProps (+66 more)

### Community 1 - "react"
Cohesion: 0.09
Nodes (62): react, CreateAccountSheet(), CreateAccountSheetProps, EditAccountSheet(), EditAccountSheetProps, AddExpenseSheet(), AddExpenseSheetProps, AddIncomeSheet() (+54 more)

### Community 2 - "member-card.tsx"
Cohesion: 0.07
Nodes (68): class-variance-authority, deleteTransaction(), updateTransaction(), ChangeRoleDialog(), ChangeRoleDialogProps, DeactivateMemberDialog(), DeactivateMemberDialogProps, MemberCard() (+60 more)

### Community 3 - "next"
Cohesion: 0.05
Nodes (38): nextConfig, next, @supabase/supabase-js, admin, AccountDeletionPage(), metadata, DELETE(), DeletionRequestBody (+30 more)

### Community 4 - "cn"
Cohesion: 0.09
Nodes (37): @radix-ui/react-dropdown-menu, @supabase/ssr, AuthCallbackPage(), CallbackInner(), AuthenticatedLayout(), AppSidebar(), CardFooter, DropdownMenuCheckboxItem() (+29 more)

### Community 5 - "invite-code-manager.tsx"
Cohesion: 0.09
Nodes (33): getInviteCodes(), InviteCodeManager(), InviteCodeManagerProps, MemberList(), MemberListProps, MembersPage(), PageProps, PageProps (+25 more)

### Community 6 - "createAdminClient"
Cohesion: 0.16
Nodes (31): addExpense(), addExpenseForMember(), AddExpenseForMemberInput, AddExpenseInput, addIncome(), addIncomeForMember(), AddIncomeForMemberInput, AddIncomeInput (+23 more)

### Community 7 - "Database Schema & Policies Document"
Cohesion: 0.10
Nodes (27): Transaction Category Management, Changelog Release 1.0.0, Changelog Release 1.1.0, Wallet Sub-Accounts Management, fn_has_org_role RLS Helper Function, Invite Codes Table, Organization Members Table, Organizations Table (+19 more)

### Community 8 - "hero.tsx"
Cohesion: 0.14
Nodes (19): fetchHeroStatisticsCached, getHeroStatistics(), HeroStats, Home(), metadata, PrivacyPage(), Footer(), footerLinks (+11 more)

### Community 9 - "records/actions.ts"
Cohesion: 0.19
Nodes (20): fetchOrganizationCategories(), fetchOrganizationMembers(), fetchTransactionAggregates(), fetchTransactions(), fetchTransactionsWithFilters(), fetchWalletSummary(), OrganizationRecordsView(), loadFilters() (+12 more)

### Community 10 - "categories.ts"
Cohesion: 0.17
Nodes (17): AddTransactionModal(), AddTransactionModalProps, evaluateMathExpression(), getDisplayBalance(), TabType, WalletFabProps, addOrganizationCategory(), formatCategoryName() (+9 more)

### Community 11 - "database.types.ts"
Cohesion: 0.09
Nodes (21): Database, Enums, FundedByType, InvitationsTable, InviteCode, Json, KeepAliveLog, KeepAliveStatus (+13 more)

### Community 12 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 13 - "package.json"
Cohesion: 0.11
Nodes (18): name, private, version, clsx, @radix-ui/react-dialog, @radix-ui/react-select, @radix-ui/react-separator, @radix-ui/react-slot (+10 more)

### Community 14 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 15 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, class-variance-authority, clsx, lucide-react, next, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-select (+9 more)

### Community 16 - "guards.ts"
Cohesion: 0.19
Nodes (12): DELETE(), PATCH(), RouteContext, POST(), RouteContext, ActionAuthFailure, ActionAuthResult, ActionAuthSuccess (+4 more)

### Community 17 - "requireOrgMembership"
Cohesion: 0.29
Nodes (10): AccountsPage(), Props, requireOrgMembership(), getTopCategories(), searchCategories(), deleteWalletAccount(), getAccountsWithBalances(), getWalletAccounts() (+2 more)

### Community 18 - "members/actions.ts"
Cohesion: 0.30
Nodes (10): createInviteCode(), deactivateMember(), reactivateMember(), revokeInviteCode(), updateMemberRole(), OrganizationSection, revalidateOrganizationMembers(), revalidateOrganizationOverview() (+2 more)

### Community 19 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+2 more)

### Community 20 - "create-test-user.mjs"
Cohesion: 0.20
Nodes (4): vitest, __dirname, supabase, testUser

### Community 21 - "m4_adversarial_challenge.test.ts"
Cohesion: 0.24
Nodes (3): MockClassList, ROOT, runScriptWithEnv()

### Community 22 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 23 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

## Knowledge Gaps
- **18 isolated node(s):** `react-dom`, `tailwindcss`, `@tailwindcss/postcss`, `@types/node`, `@types/react` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 279 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `Button`, `react`, `member-card.tsx`, `cn`, `invite-code-manager.tsx`, `hero.tsx`, `records/actions.ts`, `categories.ts`, `package.json`, `guards.ts`, `requireOrgMembership`, `members/actions.ts`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **What connects `react-dom`, `tailwindcss`, `@tailwindcss/postcss` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.07468259895444361 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `Button`, `member-card.tsx`, `next`, `cn`, `invite-code-manager.tsx`, `hero.tsx`, `records/actions.ts`, `categories.ts`, `package.json`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.093296853625171 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Button` to `react`, `member-card.tsx`, `cn`, `invite-code-manager.tsx`, `hero.tsx`, `categories.ts`, `package.json`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Should `member-card.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07467630231857875 - nodes in this community are weakly interconnected._