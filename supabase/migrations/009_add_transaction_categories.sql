-- Migration 009: Add Transaction Categories with Fuzzy Matching
-- Description: Create normalized category system with alias support and fuzzy matching
-- Purpose: Unify category inputs across transactions with typo tolerance

-- Create transaction_categories table
CREATE TABLE IF NOT EXISTS public.transaction_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
    normalized_name TEXT NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    is_custom BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, normalized_name)
);

-- Add category_id column to transactions (nullable for backward compatibility)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.transaction_categories (id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transaction_categories_org ON public.transaction_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_transaction_categories_normalized_name ON public.transaction_categories(organization_id, normalized_name);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);

-- Enable RLS on transaction_categories
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view categories for their organizations
CREATE POLICY "Users can view categories for their organizations" 
    ON public.transaction_categories 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = organization_id
            AND om.user_id = auth.uid()
        )
    );

-- RLS Policy: Only admins/owners can insert/update/delete categories
CREATE POLICY "Admins and owners can manage categories"
    ON public.transaction_categories
    FOR INSERT
    WITH CHECK (
        public.fn_has_org_role(organization_id, ARRAY['owner', 'admin']::text[])
    );

CREATE POLICY "Admins and owners can update categories"
    ON public.transaction_categories
    FOR UPDATE
    USING (
        public.fn_has_org_role(organization_id, ARRAY['owner', 'admin']::text[])
    )
    WITH CHECK (
        public.fn_has_org_role(organization_id, ARRAY['owner', 'admin']::text[])
    );

CREATE POLICY "Admins and owners can delete categories"
    ON public.transaction_categories
    FOR DELETE
    USING (
        public.fn_has_org_role(organization_id, ARRAY['owner', 'admin']::text[])
    );

-- Function: Calculate Levenshtein distance for fuzzy matching
CREATE OR REPLACE FUNCTION public.levenshtein_distance(s1 TEXT, s2 TEXT)
RETURNS INT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  len1 INT := LENGTH(s1);
  len2 INT := LENGTH(s2);
  d INT[][];
  i INT;
  j INT;
BEGIN
  -- Create matrix with dimensions (len1+1) x (len2+1)
  d := array_fill(0, ARRAY[len1 + 1, len2 + 1]);
  
  -- Initialize first column and row
  FOR i IN 0..len1 LOOP
    d[i+1][1] := i;
  END LOOP;
  
  FOR j IN 0..len2 LOOP
    d[1][j+1] := j;
  END LOOP;
  
  -- Fill the matrix
  FOR i IN 1..len1 LOOP
    FOR j IN 1..len2 LOOP
      IF SUBSTR(s1, i, 1) = SUBSTR(s2, j, 1) THEN
        d[i+1][j+1] := d[i][j];
      ELSE
        d[i+1][j+1] := 1 + LEAST(
          d[i][j],        -- substitution
          d[i+1][j],      -- deletion
          d[i][j+1]       -- insertion
        );
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN d[len1+1][len2+1];
END;
$$;

-- Function: Get or create normalized category with fuzzy matching
CREATE OR REPLACE FUNCTION public.get_or_create_category(
  p_org_id UUID,
  p_input_name TEXT,
  p_max_distance INT DEFAULT 2
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_id UUID;
  v_normalized_input TEXT;
  v_match_id UUID;
  v_min_distance INT;
BEGIN
  -- Normalize input: lowercase, trim, collapse whitespace
  v_normalized_input := LOWER(TRIM(REGEXP_REPLACE(p_input_name, '\s+', ' ', 'g')));
  
  -- Return NULL if empty
  IF v_normalized_input = '' THEN
    RETURN NULL;
  END IF;
  
  -- Exact match first
  SELECT id INTO v_category_id
  FROM public.transaction_categories
  WHERE organization_id = p_org_id
    AND normalized_name = v_normalized_input
  LIMIT 1;
  
  IF v_category_id IS NOT NULL THEN
    RETURN v_category_id;
  END IF;
  
  -- Fuzzy match: find closest match within distance threshold
  SELECT id, MIN(public.levenshtein_distance(normalized_name, v_normalized_input)) as min_dist
  INTO v_match_id, v_min_distance
  FROM public.transaction_categories
  WHERE organization_id = p_org_id
    AND public.levenshtein_distance(normalized_name, v_normalized_input) <= p_max_distance
  GROUP BY id
  ORDER BY min_dist ASC
  LIMIT 1;
  
  IF v_match_id IS NOT NULL THEN
    -- Found a fuzzy match; add input as alias if not already present
    UPDATE public.transaction_categories
    SET aliases = CASE
      WHEN NOT (aliases @> ARRAY[v_normalized_input]) THEN array_append(aliases, v_normalized_input)
      ELSE aliases
    END
    WHERE id = v_match_id;
    
    RETURN v_match_id;
  END IF;
  
  -- No match found: create new category
  INSERT INTO public.transaction_categories (organization_id, normalized_name, aliases, is_custom)
  VALUES (p_org_id, v_normalized_input, ARRAY[]::TEXT[], TRUE)
  RETURNING id INTO v_category_id;
  
  RETURN v_category_id;
END;
$$;

-- Add comment for documentation
COMMENT ON TABLE public.transaction_categories IS 'Normalized transaction categories per organization to unify category inputs and support fuzzy matching';
COMMENT ON FUNCTION public.levenshtein_distance(TEXT, TEXT) IS 'Calculate Levenshtein distance between two strings for fuzzy matching';
COMMENT ON FUNCTION public.get_or_create_category(UUID, TEXT, INT) IS 'Get or create a category with fuzzy matching support (Levenshtein distance <= threshold)';
