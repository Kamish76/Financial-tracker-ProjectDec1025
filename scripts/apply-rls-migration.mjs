import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey)

async function applyMigration() {
  try {
    console.log('Applying migration...')

    // Execute SQL to drop and recreate policies
    const { data, error } = await admin.rpc('exec', {
      sql: `
        drop policy if exists orgs_select_member on public.organizations;
        drop policy if exists orgs_select_searchable on public.organizations;

        create policy orgs_select_member on public.organizations
          for select using (public.fn_has_org_role(id, array['owner','admin','member']));

        create policy orgs_select_all_authenticated on public.organizations
          for select using (auth.role() = 'authenticated');
      `,
    })

    if (error) {
      console.error('Error:', error)
      process.exit(1)
    }

    console.log('Migration applied successfully')
  } catch (err) {
    console.error('Failed to apply migration:', err)
    process.exit(1)
  }
}

applyMigration()
