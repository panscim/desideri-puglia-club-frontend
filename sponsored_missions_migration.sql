-- Add sponsored mission fields to missioni_catalogo
ALTER TABLE missioni_catalogo 
ADD COLUMN is_sponsored BOOLEAN DEFAULT FALSE,
ADD COLUMN cost_tokens INTEGER DEFAULT 0;

-- Comment on columns
COMMENT ON COLUMN missioni_catalogo.is_sponsored IS 'If true, this mission is highlighted as sponsored';
COMMENT ON COLUMN missioni_catalogo.cost_tokens IS 'Cost in tokens for the partner to sponsor this mission (informational or for future logic)';
