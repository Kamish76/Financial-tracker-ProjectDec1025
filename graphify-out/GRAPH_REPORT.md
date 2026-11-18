# Graph Report - Financial-tracker-ProjectDec1025  (2026-11-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 825 nodes · 3104 edges · 31 communities (25 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b9755805`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Button
- wallet-transaction-edit-dialog.tsx
- wallet-records-view.tsx
- organization-settings.tsx
- cn
- server.ts
- next
- Database Schema & Policies Document
- createAdminClient
- isWalletOrganization
- org-transaction-modal.tsx
- requireOrgMembership
- database.types.ts
- invite-code-manager.tsx
- package.json
- components.json
- compilerOptions
- dependencies
- PageSkeleton
- members/actions.ts
- devDependencies
- add-transaction-modal.tsx
- scripts
- category-dropdown.tsx
- eslint.config.mjs
- Context & Architecture Routing
- CI Validate Job
- postcss.config.mjs
- styles.d.ts
- empty.ts
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `Button` - 97 edges
2. `createAdminClient()` - 84 edges
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

## Communities (31 total, 6 thin omitted)

### Community 0 - "Button"
Cohesion: 0.06
Nodes (90): lucide-react, react, AuthForm(), AuthPage(), createOrganization(), createWallet(), CreateOrganizationPage(), AddExpenseSheet() (+82 more)

### Community 1 - "wallet-transaction-edit-dialog.tsx"
Cohesion: 0.08
Nodes (70): deleteTransaction(), updateTransaction(), ChangeRoleDialog(), ChangeRoleDialogProps, DeactivateMemberDialog(), DeactivateMemberDialogProps, MemberCard(), MemberCardProps (+62 more)

### Community 2 - "wallet-records-view.tsx"
Cohesion: 0.05
Nodes (52): vitest, __dirname, supabase, testUser, GET(), runtime, fetchOrganizationCategories(), fetchOrganizationMembers() (+44 more)

### Community 3 - "organization-settings.tsx"
Cohesion: 0.13
Nodes (48): CreateAccountSheet(), CreateAccountSheetProps, EditAccountSheet(), EditAccountSheetProps, addExpenseForMember(), addIncomeForMember(), MemberList(), MemberListProps (+40 more)

### Community 4 - "cn"
Cohesion: 0.09
Nodes (38): @radix-ui/react-dropdown-menu, @supabase/ssr, AuthCallbackPage(), CallbackInner(), AuthenticatedLayout(), AppSidebar(), OrgFinanceLogoMark(), CardFooter (+30 more)

### Community 5 - "server.ts"
Cohesion: 0.07
Nodes (36): @supabase/supabase-js, admin, AccountDeletionPage(), metadata, DELETE(), DeletionRequestBody, GET(), handleCancellation() (+28 more)

### Community 6 - "next"
Cohesion: 0.08
Nodes (29): nextConfig, next, fetchHeroStatisticsCached, getHeroStatistics(), HeroStats, metadata, Home(), metadata (+21 more)

### Community 7 - "Database Schema & Policies Document"
Cohesion: 0.10
Nodes (27): Transaction Category Management, Changelog Release 1.0.0, Changelog Release 1.1.0, Wallet Sub-Accounts Management, fn_has_org_role RLS Helper Function, Invite Codes Table, Organization Members Table, Organizations Table (+19 more)

### Community 8 - "createAdminClient"
Cohesion: 0.14
Nodes (27): POST(), RouteContext, AddExpenseForMemberInput, AddExpenseInput, AddIncomeForMemberInput, AddIncomeInput, addInitialTransaction(), AddInitialTransactionInput (+19 more)

### Community 9 - "isWalletOrganization"
Cohesion: 0.15
Nodes (17): DELETE(), PATCH(), RouteContext, mapMemberProfiles(), MemberRow, MembersPage(), PageProps, PageProps (+9 more)

### Community 10 - "org-transaction-modal.tsx"
Cohesion: 0.21
Nodes (20): addExpense(), addIncome(), createRefund(), OrgTransactionModal(), OrgTransactionModalProps, OrgTransactionTab, ManageCategoriesDialog(), ManageCategoriesDialogProps (+12 more)

### Community 11 - "requireOrgMembership"
Cohesion: 0.21
Nodes (18): AccountsClient(), AccountsClientProps, AccountsPage(), Props, WalletFabProps, requireOrgMembership(), createWalletAccount(), deleteWalletAccount() (+10 more)

### Community 12 - "database.types.ts"
Cohesion: 0.09
Nodes (21): Database, Enums, FundedByType, InvitationsTable, InviteCode, Json, KeepAliveLog, KeepAliveStatus (+13 more)

### Community 13 - "invite-code-manager.tsx"
Cohesion: 0.18
Nodes (16): InviteCodeManager(), InviteCodeManagerProps, CreateInviteInput, formatCreatedDate(), formatInviteCode(), formatRemainingUses(), getInviteCodeBadge(), getRemainingUses() (+8 more)

### Community 14 - "package.json"
Cohesion: 0.10
Nodes (19): name, private, version, class-variance-authority, clsx, @radix-ui/react-dialog, @radix-ui/react-select, @radix-ui/react-separator (+11 more)

### Community 15 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 16 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 17 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, class-variance-authority, clsx, lucide-react, next, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-select (+9 more)

### Community 18 - "PageSkeleton"
Cohesion: 0.27
Nodes (7): Loading(), Loading(), Loading(), Loading(), Loading(), Loading(), PageSkeleton()

### Community 19 - "members/actions.ts"
Cohesion: 0.31
Nodes (12): createInviteCode(), deactivateMember(), getInviteCodes(), reactivateMember(), revokeInviteCode(), updateMemberRole(), authorizeOrgAction(), OrganizationSection (+4 more)

### Community 20 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+2 more)

### Community 21 - "add-transaction-modal.tsx"
Cohesion: 0.33
Nodes (7): AddTransactionModal(), AddTransactionModalProps, evaluateMathExpression(), getDisplayBalance(), TabType, addWalletTransaction(), AddWalletTransactionInput

### Community 22 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 23 - "category-dropdown.tsx"
Cohesion: 0.40
Nodes (5): Category, CategoryDropdown(), CategoryDropdownProps, getTopCategories(), searchCategories()

### Community 24 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

## Knowledge Gaps
- **18 isolated node(s):** `react-dom`, `tailwindcss`, `@tailwindcss/postcss`, `@types/node`, `@types/react` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 289 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `Button`, `wallet-transaction-edit-dialog.tsx`, `wallet-records-view.tsx`, `organization-settings.tsx`, `cn`, `server.ts`, `createAdminClient`, `isWalletOrganization`, `org-transaction-modal.tsx`, `requireOrgMembership`, `package.json`, `members/actions.ts`, `add-transaction-modal.tsx`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **What connects `react-dom`, `tailwindcss`, `@tailwindcss/postcss` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.06477409036385445 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Button` to `wallet-transaction-edit-dialog.tsx`, `wallet-records-view.tsx`, `organization-settings.tsx`, `cn`, `server.ts`, `next`, `isWalletOrganization`, `org-transaction-modal.tsx`, `requireOrgMembership`, `invite-code-manager.tsx`, `package.json`, `add-transaction-modal.tsx`, `category-dropdown.tsx`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Should `wallet-transaction-edit-dialog.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07507002801120448 - nodes in this community are weakly interconnected._
- **Why does `Button` connect `Button` to `wallet-transaction-edit-dialog.tsx`, `wallet-records-view.tsx`, `organization-settings.tsx`, `cn`, `next`, `org-transaction-modal.tsx`, `requireOrgMembership`, `invite-code-manager.tsx`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Should `wallet-records-view.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05189189189189189 - nodes in this community are weakly interconnected._