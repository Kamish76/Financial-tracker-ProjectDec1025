# Vercel Cron Job Keep-Alive Setup Guide

## Overview

The keep-alive system prevents your Supabase free-tier database from pausing after 7 days of inactivity by running a daily health check via Vercel Cron Job.

---

## Files Created

1. **`supabase/migrations/008_add_keep_alive_logs.sql`** - Database migration for audit logging table
2. **`src/app/api/health-check/route.ts`** - API endpoint that pings database and logs results
3. **`vercel.json`** - Vercel configuration for cron job scheduling
4. **`.env.example`** - Updated with CRON_SECRET variable

---

## Setup Instructions

### Step 1: Apply Database Migration

Run the migration in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/008_add_keep_alive_logs.sql`
3. Copy contents and paste into SQL Editor
4. Click "Run" to create the `keep_alive_logs` table

### Step 2: Configure Environment Variables

Add the following to your `.env.local` (local development) and Vercel Dashboard (production):

```bash
# Generate a strong random secret (use a password generator)
CRON_SECRET=your-super-secret-random-string-here

# Optional but recommended for better logging
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase-dashboard
```

**To get your Supabase Service Role Key:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the "service_role" key (keep this secret!)
3. Add to `.env.local` and Vercel environment variables

**To add environment variables in Vercel:**
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add `CRON_SECRET` (Production, Preview, Development)
4. Add `SUPABASE_SERVICE_ROLE_KEY` (Production, Preview, Development)

### Step 3: Deploy to Vercel

```bash
# Commit your changes
git add .
git commit -m "Add Vercel Cron Job keep-alive system"
git push

# Deploy to Vercel (if not auto-deployed)
vercel --prod
```

The `vercel.json` file will automatically configure the cron job during deployment.

### Step 4: Verify Cron Job Setup

After deployment:

1. Go to Vercel Dashboard → Your Project → Cron tab
2. You should see:
   - **Path**: `/api/health-check`
   - **Schedule**: `0 1 * * *` (Daily at 1:00 AM UTC)
   - **Status**: Active

### Step 5: Test the Endpoint Manually

Before waiting for the scheduled run, test it manually:

```bash
# Replace with your actual Vercel URL and CRON_SECRET
curl https://your-app.vercel.app/api/health-check \
  -H "Authorization: Bearer your-cron-secret-here"
```

**Expected Response:**
```json
{
  "success": true,
  "timestamp": "2026-01-19T12:00:00.000Z",
  "stats": {
    "organizations": 3,
    "transactions": 42,
    "responseTimeMs": 127
  },
  "message": "Database keep-alive successful"
}
```

### Step 6: Monitor Execution Logs

View logs in the `keep_alive_logs` table:

```sql
-- View last 10 executions
SELECT 
  executed_at,
  database_active,
  organization_count,
  transaction_count,
  response_time_ms,
  status,
  error_message
FROM keep_alive_logs
ORDER BY executed_at DESC
LIMIT 10;
```

---

## How It Works

### Daily Execution Flow

1. **Vercel Cron** triggers at ~1:00 AM UTC daily (Hobby plan: ±1 hour variance)
2. **Health Check Endpoint** receives GET request with Authorization header
3. **Security Check** verifies CRON_SECRET matches environment variable
4. **Database Query** counts organizations and transactions
5. **Audit Log** records execution details to `keep_alive_logs` table
6. **Response** returns success/error status with statistics

### Vercel Hobby Plan Limitations

- **Cron Jobs per Project**: 2 (currently using 1)
- **Execution Frequency**: Once per day maximum
- **Timing Accuracy**: ±1 hour variance (may run anywhere from 12:00 AM to 2:00 AM UTC)
- **Function Invocations**: Subject to Vercel Functions usage limits

**Note**: For precise timing and unlimited invocations, upgrade to Vercel Pro ($20/month).

---

## Troubleshooting

### Error: "Unauthorized"

**Cause**: CRON_SECRET mismatch or missing Authorization header

**Solution**:
1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Check Authorization header format: `Bearer your-secret-here`
3. Redeploy after adding environment variables

### Error: "Server configuration error"

**Cause**: CRON_SECRET environment variable not configured

**Solution**:
1. Add `CRON_SECRET` to Vercel Dashboard → Settings → Environment Variables
2. Redeploy the project

### Cron Job Not Running

**Possible Causes**:
1. `vercel.json` not committed to repository
2. Deployment didn't pick up the configuration
3. Vercel account has reached cron job limits

**Solution**:
1. Verify `vercel.json` exists in project root
2. Redeploy: `vercel --prod`
3. Check Vercel Dashboard → Cron tab for job status
4. Check Vercel Dashboard → Settings → Usage for limits

### Database Still Pausing

**Cause**: Cron job may not be executing (Hobby plan timing variance) or Supabase still detects inactivity

**Solution**:
1. Check `keep_alive_logs` table to verify daily executions
2. Add external uptime monitor as backup (UptimeRobot, Healthchecks.io)
3. Supabase also emails before pausing - you'll have time to manually ping if needed

---

## Monitoring & Maintenance

### View Execution History

Create a simple query to monitor health check performance:

```sql
-- Check last 30 days of keep-alive activity
SELECT 
  DATE(executed_at) as date,
  COUNT(*) as executions,
  AVG(response_time_ms) as avg_response_time,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed
FROM keep_alive_logs
WHERE executed_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(executed_at)
ORDER BY date DESC;
```

### Success Rate Dashboard (Future Enhancement)

You can build a monitoring page in your app to visualize:
- Daily ping success rate
- Average response time trends
- Organization/transaction growth over time
- Error frequency and types

---

## Cost Analysis

### Current Setup (Free)

- **Vercel Hobby Plan**: $0/month (includes 2 cron jobs, once-per-day execution)
- **Supabase Free Tier**: $0/month (keeps database alive with daily pings)
- **Total**: $0/month

### Recommended Backup (Free)

Add external uptime monitor as redundancy:
- **UptimeRobot**: Free plan (50 monitors, 5-minute checks)
- **Setup**: Add monitor pointing to `https://your-app.vercel.app/api/health-check` with custom HTTP header `Authorization: Bearer your-secret`
- **Schedule**: Every 5-6 days to supplement Vercel cron

### Upgrade Path (Optional)

- **Vercel Pro**: $20/month
  - Unlimited cron jobs
  - Precise timing (no ±1 hour variance)
  - Higher function invocation limits
  - Recommended for production apps with SLA requirements

---

## Security Best Practices

1. **CRON_SECRET**: Use a strong random string (32+ characters)
2. **Service Role Key**: Never commit to version control, use environment variables only
3. **Endpoint Access**: Only allow requests with valid Authorization header
4. **Audit Logs**: Regularly review `keep_alive_logs` for suspicious activity
5. **Rate Limiting**: Consider adding rate limiting to health-check endpoint if making it publicly accessible

---

## Future Enhancements

- [ ] Add monitoring dashboard page in app UI
- [ ] Email/Slack notifications on failed health checks
- [ ] Extend to backup data to Google Sheets (Phase 6 roadmap)
- [ ] Add webhook support for external monitoring services
- [ ] Implement retry logic for failed pings

---

## Summary

✅ **What You Have Now:**
- Daily automated database pings prevent Supabase free-tier pausing
- Full audit trail in `keep_alive_logs` table
- Secure endpoint protected by CRON_SECRET
- Zero-cost solution on Vercel Hobby plan

✅ **What You Need to Do:**
1. Apply migration 008 to create `keep_alive_logs` table
2. Set `CRON_SECRET` environment variable in Vercel
3. Deploy to production
4. Test manually with curl
5. Monitor `keep_alive_logs` table for daily executions

✅ **What Happens Next:**
- Vercel cron runs daily at ~1:00 AM UTC
- Database stays active and won't pause
- You can check logs to verify executions
- Supabase won't send pause warnings as long as cron is running

---

**Questions or Issues?** Check Vercel Dashboard → Cron tab and review `keep_alive_logs` table for execution history.
