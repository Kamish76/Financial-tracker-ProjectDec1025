import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Health Check API Route for Vercel Cron Job
 * 
 * Purpose: Prevents Supabase free-tier database from auto-pausing after 7 days of inactivity
 * 
 * Security: Protected by CRON_SECRET environment variable
 * Scheduled: Daily via Vercel Cron (see vercel.json)
 * Logs: Records execution details to keep_alive_logs table
 */

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Security: Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error('CRON_SECRET environment variable not configured');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Server configuration error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader?.replace('Bearer ', '');

    if (token !== expectedSecret) {
      console.warn('Unauthorized health check attempt');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    // Initialize Supabase client with service role for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
    );

    // Query database to keep it active
    const [orgsResult, transactionsResult] = await Promise.all([
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
      supabase.from('transactions').select('id', { count: 'exact', head: true })
    ]);

    const organizationCount = orgsResult.count || 0;
    const transactionCount = transactionsResult.count || 0;
    const responseTime = Date.now() - startTime;

    // Log execution to audit table
    const { error: logError } = await supabase
      .from('keep_alive_logs')
      .insert({
        executed_at: new Date().toISOString(),
        database_active: true,
        organization_count: organizationCount,
        transaction_count: transactionCount,
        response_time_ms: responseTime,
        status: 'success',
        error_message: null
      });

    if (logError) {
      console.error('Failed to log keep-alive execution:', logError);
      // Don't fail the request if logging fails
    }

    // Return success response
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        organizations: organizationCount,
        transactions: transactionCount,
        responseTimeMs: responseTime
      },
      message: 'Database keep-alive successful'
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Health check error:', error);

    // Attempt to log error to database
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
      );

      await supabase
        .from('keep_alive_logs')
        .insert({
          executed_at: new Date().toISOString(),
          database_active: false,
          organization_count: 0,
          transaction_count: 0,
          response_time_ms: responseTime,
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Vercel Cron Jobs send GET requests
export const runtime = 'edge'; // Use edge runtime for faster cold starts
