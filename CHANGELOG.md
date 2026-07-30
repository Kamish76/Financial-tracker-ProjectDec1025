# Changelog

All notable changes to the Financial Tracker project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- *Reserved for upcoming features and enhancements.*

---

## [1.1.0] - 2026-07-29

### Added

#### Personal Wallet Mode (`is_wallet = true`)
- Added single-tenant **Personal Wallet** organizations (`is_wallet = true`) for streamlined personal expense tracking without multi-user business overhead.
- Added automatic spawning of a default `'Cash'` sub-account (`starting_value: 0`, `is_active: true`) when creating a new Personal Wallet organization.
- Integrated schema-less identification and dedicated Wallet navigation sidebar cards (`Wallet Sub Accounts`, `Wallet Settings`).
- Hidden multi-user business features (such as "Quick actions" and "Member balances") in Personal Wallet Mode.

#### Wallet Sub-Accounts Management
- Added the `wallet_accounts` table (`010_add_wallet_accounts.sql`) to support multiple sub-accounts per organization (e.g., Cash, Bank, Mobile Wallet).
- Implemented full CRUD server actions and dialogs for managing organization sub-accounts.
- Added `AccountsClient` component with support for archiving, deleting, and viewing balance summaries.
- Enforced account deletion safeguard: accounts referenced by any transaction cannot be hard-deleted and must be archived (`is_active = false`) instead.

#### Wallet Transfers & Transaction Enhancements
- Added **Wallet Transfer** transaction type (`011_add_wallet_transfer_type.sql`) for inter-account transfers between sub-accounts.
- Supported income, expense, and account transfer flows in transaction modals and server actions.
- Implemented interactive transaction records management page with advanced filtering, fuzzy-matched category filters, and infinite scroll.

#### Category Management System
- Added transaction category management schema (`009_add_transaction_categories.sql`) with custom icons, colors, and organization-scoped categories.
- Implemented category management dialog with CRUD operations, auto-seeding default categories, and seamless transaction integration.

#### Organization Settings & Ownership
- Added organization settings page and edit dialog for modifying organization details, descriptions, and ownership transfers.

### Changed

#### Dashboard & Navigation
- Upgraded the organization dashboard to dynamically switch between Wallet-specific views and Multi-User Business views.
- Consolidated sidebar navigation to adapt links and quick actions based on the organization mode (`is_wallet`).

### Fixed

#### Records & Transaction Views
- Fixed transaction record viewing and modal state bugs (`hotfix/view-transaction-record-bug`).
- Resolved cache invalidation and revalidation edge cases for organization finance summaries and sub-account balances.

---

## [1.0.0] - 2026-01-07

### Added

#### Core Platform & Authentication
- Implemented Supabase authentication with Google OAuth, signup/login flows, and request-scoped authentication context.
- Added protected route layouts and centralized server-action / route handler authorization guards (`requireOrgMembership`).
- Implemented organization creation, membership management, and invite code joining (`004_allow_org_search_for_join.sql`).

#### User Accountability & Reimbursement System
- Added `user_contributions`, `reimbursement_requests`, and optional `transaction_allocations` tables (`002_add_user_accountability_system.sql`).
- Added transaction funding attribution (`funded_by_type`, `funded_by_user_id`, `updated_by_user_id`).
- Implemented approval workflow for out-of-pocket reimbursements (pending → approved → paid/rejected).

#### Financial Statistics & Analytics
- Implemented comprehensive financial dashboard with period statistics (`calculatePeriodStats`, weekly/monthly toggle via `PeriodStatsCard`).
- Added filtered statistics sticky header and utilities (`calculateFilteredStats`, `FilteredStatsCard`).
- Created dedicated client-side utilities (`finance-client.ts`) for clean client/server boundary separation.

#### Database & System Infrastructure
- Created core database schema (`profiles`, `organizations`, `organization_members`, `invite_codes`, `transactions`).
- Added Keep-Alive log system (`008_add_keep_alive_logs.sql`) for database uptime monitoring.
- Configured dark mode theme synchronization across CSS classes and data attributes.
