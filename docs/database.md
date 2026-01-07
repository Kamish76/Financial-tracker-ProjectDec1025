# Database Schema & Policies (Supabase)

Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor (email or Google auth enabled). This file documents tables, roles, and RLS behavior.

## Tables

### Core Tables
- **`profiles`**: 1:1 with `auth.users` (id, full_name, avatar_url, created_at). Auto-populated via trigger on user signup.
- **`organizations`**: Org metadata (id, name, description, owner_id, created_at). `owner_id` references `profiles.id`.
- **`organization_members`**: Membership junction table with roles (`owner`, `admin`, `member`). Unique per org/user. Tracks inviter.
- **`invite_codes`**: Organization invite codes (id, organization_id, code, expires_at, created_by, created_at).

### Financial Tracking Tables
- **`transactions`**: Core financial records with enhanced accountability:
  - `id`, `organization_id`, `user_id` (who recorded it)
  - `type`: `income` | `expense_business` | `expense_personal`
  - `amount`, `description`, `category`, `occurred_at`
  - **`funded_by_type`**: `business` (org funds) | `personal` (out-of-pocket)
  - **`funded_by_user_id`**: Who actually paid (null = business account)
  - **`updated_by_user_id`**: Who last edited (audit trail)
  - `created_at`, `updated_at`

- **`user_contributions`**: Per-user balance tracking (calculated on-demand, cached):
  - `organization_id`, `user_id`
  - `total_contributed`: Sum of personal funds added
  - `total_received`: Sum of reimbursements received
  - `net_balance`: Generated column (contributed - received)
  - `last_calculated_at`: Cache timestamp

- **`reimbursement_requests`**: Track out-of-pocket expenses needing reimbursement:
  - `id`, `organization_id`, `transaction_id`
  - `from_user_id` (who paid out-of-pocket), `to_user_id` (who will reimburse, null = org)
  - `amount`, `status` (`pending` | `approved` | `paid` | `rejected`)
  - `approval_required`: Boolean (per-org setting)
  - `notes`, `created_at`, `resolved_at`, `resolved_by`

- **`transaction_allocations`** (Optional): Support for split/shared costs:
  - `transaction_id`, `user_id`
  - `allocated_amount`: This user's share
  - `allocation_reason`: Optional note

## Roles & Permissions
- **member (viewer)**: Read-only for org data, transactions, user contributions, and reimbursement requests they belong to. Can view their own balance and contribution history.
- **admin**: Everything members can do **plus** create/update/delete transactions, manage members (accept invites, change roles), manage invite codes, manage reimbursement requests, and update user contributions.
- **owner**: Everything admins can do **plus** transfer ownership and delete the organization.

## RLS Highlights
- All tables have RLS enabled.
- Membership check uses `fn_has_org_role(org_id, roles[])` comparing `auth.uid()` to `organization_members`.
- Select visibility for org-scoped tables restricted to members of that org.
- Writes on transactions, user contributions, and reimbursements require `admin` or `owner` membership.
- Reimbursement request creation allowed for all members (to report out-of-pocket expenses).
- Transaction allocations follow transaction organization membership rules.
- Organization updates/deletes require `owner` membership.
- Profiles are self-readable/updatable only.

## Data Integrity & Accountability
- **Audit Trail**: All transaction edits tracked via `updated_by_user_id`
- **Funding Source**: Every transaction records `funded_by_type` (business vs personal) and optionally `funded_by_user_id`
- **Balance Calculation**: User contributions calculated on-demand and cached in `user_contributions` table
- **Reimbursement Workflow**: Out-of-pocket expenses can be flagged for reimbursement (approval system optional per org)
- **Cost Splitting**: Optional allocations table supports shared expense tracking

## Applying the Schema
1) Open Supabase Dashboard → SQL Editor.
2) Paste the contents of `supabase/schema.sql` and run.
3) Enable Auth providers: Email and Google.

## Auth Redirect URIs
- Production: `${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`
- Local dev: `http://localhost:3000/auth/callback`

## Notes
- Keep migrations versioned in-repo; this SQL is the source of truth for Phase 1.
- Invite creation/role changes should be executed by admins/owners; ownership transfer stays owner-only.
- **Balance Calculation Strategy**: Using on-demand calculation (Option B) for simplicity. Balances are calculated when needed and cached in `user_contributions`. Suitable for small-to-medium transaction volumes.
- **Transaction Types**: Renamed `expense_out_of_pocket` to `expense_personal` for clarity.
- **Funding Sources**: Two categories only - "business" (organization funds) and "personal" (out-of-pocket/capital contributions).
- **Reimbursement Approval**: Disabled by default, can be enabled per organization in settings.
