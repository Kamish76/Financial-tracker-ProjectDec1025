-- Migration 008: Add Keep-Alive Logs Table
-- Description: Create audit table to track database keep-alive pings from Vercel Cron Job
-- Purpose: Monitor database activity and prevent Supabase free-tier auto-pause

-- Create keep_alive_logs table
CREATE TABLE IF NOT EXISTS public.keep_alive_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    database_active BOOLEAN NOT NULL DEFAULT TRUE,
    organization_count INTEGER NOT NULL,
    transaction_count INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for efficient querying by execution time
CREATE INDEX idx_keep_alive_logs_executed_at ON public.keep_alive_logs(executed_at DESC);

-- Add index for status filtering
CREATE INDEX idx_keep_alive_logs_status ON public.keep_alive_logs(status);

-- Enable RLS (Row Level Security)
ALTER TABLE public.keep_alive_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow service role (cron job) to insert logs
CREATE POLICY "Allow service role to insert keep-alive logs"
    ON public.keep_alive_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- RLS Policy: Allow authenticated users to view keep-alive logs (for monitoring dashboard)
CREATE POLICY "Allow authenticated users to view keep-alive logs"
    ON public.keep_alive_logs
    FOR SELECT
    TO authenticated
    USING (true);

-- Add comment for documentation
COMMENT ON TABLE public.keep_alive_logs IS 'Audit trail for Vercel Cron Job database keep-alive pings to prevent Supabase free-tier auto-pause';
COMMENT ON COLUMN public.keep_alive_logs.executed_at IS 'Timestamp when the keep-alive check was executed';
COMMENT ON COLUMN public.keep_alive_logs.database_active IS 'Boolean indicating if database responded successfully';
COMMENT ON COLUMN public.keep_alive_logs.organization_count IS 'Total number of organizations at execution time';
COMMENT ON COLUMN public.keep_alive_logs.transaction_count IS 'Total number of transactions at execution time';
COMMENT ON COLUMN public.keep_alive_logs.response_time_ms IS 'Database query response time in milliseconds';
COMMENT ON COLUMN public.keep_alive_logs.status IS 'Execution status: success, error, or warning';
COMMENT ON COLUMN public.keep_alive_logs.error_message IS 'Error details if status is error or warning';
