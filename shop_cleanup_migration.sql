-- shop_cleanup_migration.sql

-- 1. Rimuovere tutti i prodotti digitali dal mercato
DELETE FROM market_items WHERE category = 'digital';

-- 2. Rimuovere la colonna price_desideri dalla tabella market_items
ALTER TABLE market_items DROP COLUMN IF EXISTS price_desideri;

-- 3. Rimuovere le funzioni RPC legate all'acquisto con Desideri
DROP FUNCTION IF EXISTS buy_market_item_with_desideri;
DROP FUNCTION IF EXISTS buy_offer_with_desideri;
DROP FUNCTION IF EXISTS recalc_desideri_balance;

-- 4. Assicurarsi che tutti i prodotti rimasti siano fisici (opzionale, per sicurezza)
UPDATE market_items SET category = 'physical' WHERE category IS NULL OR category = '';
