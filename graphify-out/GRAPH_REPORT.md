# Graph Report - Financial-tracker-ProjectDec1025  (2026-10-17)

## Corpus Check
- 157 files · ~78,202 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 3, .example 1, .csv 1)

## Summary
- 749 nodes · 2719 edges · 33 communities (26 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Auth & Core Server Actions
- Member Management & Dialogs
- Core Framework & Vendor Dependencies
- Organization Member Directory
- Organization Management API Routes
- App Shell & Navigation
- Database & Project Documentation
- Supabase Database Schema Types
- UI Package Core Dependencies
- Node Runtime & Test Utilities
- Shadcn UI Component Config
- TypeScript Compiler Options
- Production Dependencies Manifest
- Account Deletion Flow
- Transaction Category System
- Wallet Quick Add Modal
- Development Dependencies Manifest
- Sub-Accounts & Records Pages
- Supabase Server Client & Auth
- Wallet Account Operations
- Next.js Edge Middleware Routing
- Health Check & Database Keep-Alive
- NPM Lifecycle Scripts
- Account Deletion API Routes
- Theme Toggle & Dark Mode
- ESLint Configuration
- Holdings & Organization Finance
- Root Layout & Global CSS
- ICM Architecture Contracts
- GitHub Actions CI Pipeline
- PostCSS Styling Pipeline
- CSS Type Declarations
- Vercel Cron Automation

## God Nodes (most connected - your core abstractions)
1. `Button` - 83 edges
2. `cn()` - 79 edges
3. `createAdminClient()` - 76 edges
4. `react` - 62 edges
5. `next` - 57 edges
6. `Input` - 54 edges
7. `lucide-react` - 50 edges
8. `Card` - 46 edges
9. `CardTitle` - 44 edges
10. `CardContent` - 44 edges

## Surprising Connections (you probably didn't know these)
- `User Accountability System` --semantically_similar_to--> `User Accountability Schema Enhancement`  [INFERRED] [semantically similar]
  README.md → docs/implementation-summary.md
- `Database Keep-Alive Architecture` --conceptually_related_to--> `Vercel Cron Job Keep-Alive Setup Guide`  [INFERRED]
  README.md → docs/keep-alive-setup-guide.md
- `Changelog Release 1.1.0` --semantically_similar_to--> `Personal Wallet Mode`  [INFERRED] [semantically similar]
  CHANGELOG.md → README.md
- `Changelog Release 1.0.0` --references--> `keep_alive_logs Table`  [EXTRACTED]
  CHANGELOG.md → docs/keep-alive-setup-guide.md
- `Changelog Release 1.0.0` --semantically_similar_to--> `User Accountability System`  [INFERRED] [semantically similar]
  CHANGELOG.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Keep-Alive Uptime Monitoring Architecture** — readme_database_keep_alive_architecture, docs_keep_alive_setup_guide_health_check_endpoint, docs_keep_alive_setup_guide_keep_alive_logs_table, docs_keep_alive_setup_guide_cron_secret_auth [EXTRACTED 1.00]
- **User Accountability and Reimbursement Subsystem** — docs_database_transactions_table, docs_database_user_contributions_table, docs_database_reimbursement_requests_table, docs_implementation_summary_balance_calculation_service [EXTRACTED 1.00]
- **Multi-Tenant Organization Membership and Authorization Pattern** — docs_database_profiles_table, docs_database_organizations_table, docs_database_organization_members_table, docs_database_fn_has_org_role [EXTRACTED 1.00]

## Communities (33 total, 7 thin omitted)

### Community 0 - "Auth & Core Server Actions"
Cohesion: 0.06
Nodes (74): getHeroStatistics(), HeroStats, AuthForm(), AuthPage(), createOrganization(), createWallet(), CreateOrganizationPage(), AccountsClient() (+66 more)

### Community 1 - "Member Management & Dialogs"
Cohesion: 0.07
Nodes (71): reactivateMember(), ChangeRoleDialog(), ChangeRoleDialogProps, DeactivateMemberDialog(), DeactivateMemberDialogProps, MemberCard(), MemberCardProps, deleteTransaction() (+63 more)

### Community 2 - "Core Framework & Vendor Dependencies"
Cohesion: 0.10
Nodes (54): nextConfig, lucide-react, next, react, @supabase/ssr, getSafeRedirect(), signInWithEmailPassword(), AuthCallbackPage() (+46 more)

### Community 3 - "Organization Member Directory"
Cohesion: 0.07
Nodes (57): MemberList(), MemberListProps, MembersPage(), PageProps, fetchOrganizationCategories(), fetchOrganizationMembers(), fetchTransactionAggregates(), fetchTransactions() (+49 more)

### Community 4 - "Organization Management API Routes"
Cohesion: 0.08
Nodes (58): DELETE(), PATCH(), RouteContext, POST(), RouteContext, addExpense(), addExpenseForMember(), AddExpenseForMemberInput (+50 more)

### Community 5 - "App Shell & Navigation"
Cohesion: 0.10
Nodes (35): @radix-ui/react-dropdown-menu, @radix-ui/react-separator, AuthenticatedLayout(), AppSidebar(), CardFooter, DropdownMenuCheckboxItem(), DropdownMenuRadioItem(), DropdownMenuShortcut() (+27 more)

### Community 6 - "Database & Project Documentation"
Cohesion: 0.10
Nodes (27): Transaction Category Management, Changelog Release 1.0.0, Changelog Release 1.1.0, Wallet Sub-Accounts Management, fn_has_org_role RLS Helper Function, Invite Codes Table, Organization Members Table, Organizations Table (+19 more)

### Community 7 - "Supabase Database Schema Types"
Cohesion: 0.09
Nodes (21): Database, Enums, FundedByType, InvitationsTable, InviteCode, Json, KeepAliveLog, KeepAliveStatus (+13 more)

### Community 8 - "UI Package Core Dependencies"
Cohesion: 0.10
Nodes (19): name, private, version, class-variance-authority, clsx, @radix-ui/react-dialog, @radix-ui/react-select, @radix-ui/react-slot (+11 more)

### Community 9 - "Node Runtime & Test Utilities"
Cohesion: 0.11
Nodes (7): vitest, __dirname, supabase, testUser, MockClassList, ROOT, runScriptWithEnv()

### Community 10 - "Shadcn UI Component Config"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 11 - "TypeScript Compiler Options"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "Production Dependencies Manifest"
Cohesion: 0.12
Nodes (17): dependencies, class-variance-authority, clsx, lucide-react, next, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-select (+9 more)

### Community 13 - "Account Deletion Flow"
Cohesion: 0.18
Nodes (12): AccountDeletionPage(), metadata, DeleteAccountPage(), metadata, ActionAuthFailure, ActionAuthResult, ActionAuthSuccess, RequireOptions (+4 more)

### Community 14 - "Transaction Category System"
Cohesion: 0.21
Nodes (12): Category, CategoryDropdown(), CategoryDropdownProps, addOrganizationCategory(), formatCategoryName(), getCategoryType(), getOrganizationCategoriesByType(), getTopCategories() (+4 more)

### Community 15 - "Wallet Quick Add Modal"
Cohesion: 0.25
Nodes (10): AddTransactionModal(), AddTransactionModalProps, evaluateMathExpression(), getDisplayBalance(), TabType, WalletFabProps, addWalletTransaction(), AddWalletTransactionInput (+2 more)

### Community 16 - "Development Dependencies Manifest"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tw-animate-css, @types/node, @types/react (+3 more)

### Community 17 - "Sub-Accounts & Records Pages"
Cohesion: 0.27
Nodes (9): AccountsPage(), Props, createTransaction(), updateTransaction(), SettingsPage(), SettingsPageProps, requireOrgMembership(), getAccountsWithBalances() (+1 more)

### Community 18 - "Supabase Server Client & Auth"
Cohesion: 0.33
Nodes (6): joinWithInviteCode(), createClient(), getCachedClient, getCachedUser, JoinWithInviteInput, UseInviteResult

### Community 19 - "Wallet Account Operations"
Cohesion: 0.50
Nodes (7): requireUser(), createWalletAccount(), deleteWalletAccount(), sanitizePostgrestFilter(), toggleArchiveWalletAccount(), updateWalletAccount(), verifyOrgAccess()

### Community 20 - "Next.js Edge Middleware Routing"
Cohesion: 0.32
Nodes (4): authRoutes, publicRoutes, updateSession(), proxy()

### Community 21 - "Health Check & Database Keep-Alive"
Cohesion: 0.29
Nodes (3): @supabase/supabase-js, admin, runtime

### Community 22 - "NPM Lifecycle Scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, test

### Community 24 - "Theme Toggle & Dark Mode"
Cohesion: 0.53
Nodes (5): getServerSnapshot(), getSnapshot(), subscribe(), Theme, ThemeToggle()

### Community 25 - "ESLint Configuration"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 26 - "Holdings & Organization Finance"
Cohesion: 0.83
Nodes (3): HoldingsPage(), requireOrgRole(), getOrganizationStats()

## Knowledge Gaps
- **19 isolated node(s):** `react-dom`, `@tailwindcss/postcss`, `@types/node`, `@types/react`, `@types/react-dom` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 280 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Core Framework & Vendor Dependencies` to `Auth & Core Server Actions`, `Member Management & Dialogs`, `Organization Member Directory`, `Organization Management API Routes`, `App Shell & Navigation`, `UI Package Core Dependencies`, `Account Deletion Flow`, `Transaction Category System`, `Wallet Quick Add Modal`, `Sub-Accounts & Records Pages`, `Supabase Server Client & Auth`, `Wallet Account Operations`, `Next.js Edge Middleware Routing`, `Health Check & Database Keep-Alive`, `Account Deletion API Routes`, `Holdings & Organization Finance`, `Root Layout & Global CSS`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **What connects `react-dom`, `@tailwindcss/postcss`, `@types/node` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth & Core Server Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.06464646464646465 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Core Framework & Vendor Dependencies` to `Auth & Core Server Actions`, `Member Management & Dialogs`, `Organization Member Directory`, `Organization Management API Routes`, `App Shell & Navigation`, `UI Package Core Dependencies`, `Account Deletion Flow`, `Transaction Category System`, `Wallet Quick Add Modal`, `Supabase Server Client & Auth`, `Theme Toggle & Dark Mode`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `Member Management & Dialogs` be split into smaller, more focused modules?**
  _Cohesion score 0.06762897620956963 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Core Framework & Vendor Dependencies` to `Auth & Core Server Actions`, `Member Management & Dialogs`, `Organization Member Directory`, `Organization Management API Routes`, `App Shell & Navigation`, `UI Package Core Dependencies`, `Wallet Quick Add Modal`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `Core Framework & Vendor Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10028011204481793 - nodes in this community are weakly interconnected._