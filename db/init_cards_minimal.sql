-- Create minimal cards table for player search/import
CREATE TABLE IF NOT EXISTS cards_minimal (
  id bigint PRIMARY KEY,
  name text NOT NULL,
  type text,
  subtype text,
  team text,
  year smallint,
  position text,
  ovr smallint,
  isPitcher boolean,
  created_at timestamptz DEFAULT now()
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_cards_minimal_name_lower ON cards_minimal (lower(name));
CREATE INDEX IF NOT EXISTS idx_cards_minimal_type ON cards_minimal (type);

-- For better fuzzy matching in Korean, consider enabling pg_trgm and creating a GIN index
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_cards_minimal_name_trgm ON cards_minimal USING gin (name gin_trgm_ops);
