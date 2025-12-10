# Database Schema & Policies (Supabase)

Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor (email or Google auth enabled). This file documents tables, roles, and RLS behavior.

## Tables
- `profiles`: 1:1 with `auth.users` (id, full_name, avatar_url, created_at).
- `organizations`: org metadata (id, name, description, owner_id, created_at); `owner_id` points to `profiles.id`.
- `organization_members`: membership + role (`owner`, `admin`, `member`), unique per org/user, tracks inviter.
- `invite_codes`: org invite codes (code, expires_at, created_by).
- `transactions`: org-scoped financial entries with `type` (`income`, `expense_business`, `expense_out_of_pocket`), amount, category, description, occurred_at, created/updated timestamps.

## Roles & Permissions
- **member (viewer)**: read-only for org data/transactions they belong to.
- **admin**: can read; can create/update/delete transactions; can manage members (accept invites, change roles), and manage invite codes.
- **owner**: everything admins can do **plus** transfer ownership and delete the organization.

## RLS Highlights
- All tables have RLS enabled.
- Membership check uses `fn_has_org_role(org_id, roles[])` comparing `auth.uid()` to `organization_members`.
- Select visibility for org-scoped tables is restricted to members of that org.
- Writes on transactions and invites require `admin` or `owner` membership.
- Organization updates/deletes require `owner` membership.
- Profiles are self-readable/updatable only.

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
