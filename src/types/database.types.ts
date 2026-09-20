/**
 * Complete Database TypeScript definitions representing the Supabase PostgreSQL
 * schema for OrgFinance after Migration 018 (Production Readiness & Security).
 *
 * Generated and validated by m1_exp_3 for Milestone 1.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type OrganizationRole = 'owner' | 'admin' | 'member'
export type TransactionType =
  | 'income'
  | 'expense_business'
  | 'expense_personal'
  | 'held_allocate'
  | 'held_return'
  | 'transfer'
export type FundedByType = 'business' | 'personal'
export type KeepAliveStatus = 'success' | 'error' | 'warning'
export type ReimbursementStatus = 'pending' | 'approved' | 'paid' | 'rejected'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          currency: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          currency?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          currency?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organizations_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      organization_members: {
        Row: {
          organization_id: string
          user_id: string
          role: OrganizationRole
          invited_by: string | null
          created_at: string
          is_active: boolean
          deactivated_at: string | null
        }
        Insert: {
          organization_id: string
          user_id: string
          role: OrganizationRole
          invited_by?: string | null
          created_at?: string
          is_active?: boolean
          deactivated_at?: string | null
        }
        Update: {
          organization_id?: string
          user_id?: string
          role?: OrganizationRole
          invited_by?: string | null
          created_at?: string
          is_active?: boolean
          deactivated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'organization_members_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'organization_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'organization_members_invited_by_fkey'
            columns: ['invited_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      transactions: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          type: TransactionType
          amount: number
          description: string | null
          category: string | null
          funded_by_type: FundedByType
          funded_by_user_id: string | null
          updated_by_user_id: string | null
          occurred_at: string
          created_at: string
          updated_at: string
          is_initial: boolean
          category_id: string | null
          account_id: string | null
          transfer_to_account_id: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          type: TransactionType
          amount: number
          description?: string | null
          category?: string | null
          funded_by_type?: FundedByType
          funded_by_user_id?: string | null
          updated_by_user_id?: string | null
          occurred_at?: string
          created_at?: string
          updated_at?: string
          is_initial?: boolean
          category_id?: string | null
          account_id?: string | null
          transfer_to_account_id?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          type?: TransactionType
          amount?: number
          description?: string | null
          category?: string | null
          funded_by_type?: FundedByType
          funded_by_user_id?: string | null
          updated_by_user_id?: string | null
          occurred_at?: string
          created_at?: string
          updated_at?: string
          is_initial?: boolean
          category_id?: string | null
          account_id?: string | null
          transfer_to_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_funded_by_user_id_fkey'
            columns: ['funded_by_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_updated_by_user_id_fkey'
            columns: ['updated_by_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'transaction_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'wallet_accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_transfer_to_account_id_fkey'
            columns: ['transfer_to_account_id']
            isOneToOne: false
            referencedRelation: 'wallet_accounts'
            referencedColumns: ['id']
          },
        ]
      }
      transaction_categories: {
        Row: {
          id: string
          organization_id: string
          normalized_name: string
          aliases: string[] | null
          is_custom: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          normalized_name: string
          aliases?: string[] | null
          is_custom?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          normalized_name?: string
          aliases?: string[] | null
          is_custom?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transaction_categories_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      wallet_accounts: {
        Row: {
          id: string
          organization_id: string
          name: string
          starting_value: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          starting_value?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          starting_value?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'wallet_accounts_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      invite_codes: {
        Row: {
          id: string
          organization_id: string
          code: string
          created_by: string | null
          created_at: string
          max_uses: number | null
          current_uses: number
          is_active: boolean
        }
        Insert: {
          id?: string
          organization_id: string
          code: string
          created_by?: string | null
          created_at?: string
          max_uses?: number | null
          current_uses?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          organization_id?: string
          code?: string
          created_by?: string | null
          created_at?: string
          max_uses?: number | null
          current_uses?: number
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'invite_codes_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invite_codes_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      keep_alive_logs: {
        Row: {
          id: string
          executed_at: string
          database_active: boolean
          organization_count: number
          transaction_count: number
          response_time_ms: number
          status: KeepAliveStatus
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          executed_at?: string
          database_active?: boolean
          organization_count: number
          transaction_count: number
          response_time_ms: number
          status: KeepAliveStatus
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          executed_at?: string
          database_active?: boolean
          organization_count?: number
          transaction_count?: number
          response_time_ms?: number
          status?: KeepAliveStatus
          error_message?: string | null
          created_at?: string
        }
        Relationships: []
      }
      reimbursement_requests: {
        Row: {
          id: string
          organization_id: string
          transaction_id: string | null
          from_user_id: string
          to_user_id: string | null
          amount: number
          status: ReimbursementStatus
          approval_required: boolean
          notes: string | null
          created_at: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          transaction_id?: string | null
          from_user_id: string
          to_user_id?: string | null
          amount: number
          status?: ReimbursementStatus
          approval_required?: boolean
          notes?: string | null
          created_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          transaction_id?: string | null
          from_user_id?: string
          to_user_id?: string | null
          amount?: number
          status?: ReimbursementStatus
          approval_required?: boolean
          notes?: string | null
          created_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reimbursement_requests_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reimbursement_requests_transaction_id_fkey'
            columns: ['transaction_id']
            isOneToOne: false
            referencedRelation: 'transactions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reimbursement_requests_from_user_id_fkey'
            columns: ['from_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reimbursement_requests_to_user_id_fkey'
            columns: ['to_user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reimbursement_requests_resolved_by_fkey'
            columns: ['resolved_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      user_contributions: {
        Row: {
          organization_id: string
          user_id: string
          total_contributed: number
          total_received: number
          net_balance: number
          last_calculated_at: string | null
        }
        Insert: {
          organization_id: string
          user_id: string
          total_contributed?: number
          total_received?: number
          last_calculated_at?: string | null
        }
        Update: {
          organization_id?: string
          user_id?: string
          total_contributed?: number
          total_received?: number
          last_calculated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_contributions_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_contributions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      transaction_allocations: {
        Row: {
          transaction_id: string
          user_id: string
          allocated_amount: number
          allocation_reason: string | null
          created_at: string
        }
        Insert: {
          transaction_id: string
          user_id: string
          allocated_amount: number
          allocation_reason?: string | null
          created_at?: string
        }
        Update: {
          transaction_id?: string
          user_id?: string
          allocated_amount?: number
          allocation_reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transaction_allocations_transaction_id_fkey'
            columns: ['transaction_id']
            isOneToOne: false
            referencedRelation: 'transactions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transaction_allocations_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_org_member_emails: {
        Args: {
          p_org_id: string
        }
        Returns: {
          user_id: string
          email: string | null
        }[]
      }
      deactivate_member: {
        Args: {
          p_organization_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      reactivate_member: {
        Args: {
          p_organization_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      transfer_organization_ownership: {
        Args: {
          p_org_id: string
          p_new_owner_id: string
        }
        Returns: void
      }
      use_invite_code: {
        Args: {
          p_code: string
          p_user_id: string
        }
        Returns: {
          organization_id: string | null
          organization_name: string | null
          success: boolean
          error_message: string | null
        }[]
      }
      get_or_create_category: {
        Args: {
          p_org_id: string
          p_input_name: string
          p_max_distance?: number
        }
        Returns: string | null
      }
      levenshtein_distance: {
        Args: {
          s1: string
          s2: string
        }
        Returns: number
      }
      fn_is_org_member: {
        Args: {
          p_org_id: string
        }
        Returns: boolean
      }
      fn_has_org_role: {
        Args: {
          p_org_id: string
          p_roles: string[]
        }
        Returns: boolean
      }
    }
    Enums: {
      organization_role: OrganizationRole
      transaction_type: TransactionType
      funded_by_type: FundedByType
      keep_alive_status: KeepAliveStatus
      reimbursement_status: ReimbursementStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

/**
 * Convenience Table Alias: "invitations" aliases to "invite_codes"
 */
export type InvitationsTable = Database['public']['Tables']['invite_codes']

/**
 * Generic Supabase helper types
 */
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
        Database['public']['Views'])
    ? (Database['public']['Tables'] &
        Database['public']['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database['public']['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
    ? Database['public']['Enums'][PublicEnumNameOrOptions]
    : never

// Convenience Model Type Aliases
export type Profile = Tables<'profiles'>
export type Organization = Tables<'organizations'>
export type OrganizationMember = Tables<'organization_members'>
export type Transaction = Tables<'transactions'>
export type TransactionCategory = Tables<'transaction_categories'>
export type WalletAccount = Tables<'wallet_accounts'>
export type InviteCode = Tables<'invite_codes'>
export type KeepAliveLog = Tables<'keep_alive_logs'>
export type ReimbursementRequest = Tables<'reimbursement_requests'>
