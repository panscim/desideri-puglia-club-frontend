// run_shop_cleanup.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;

// Usa la connection string diretta se disponibile, altrimenti costruiscila
const connectionString = process.env.DATABASE_URL || `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${process.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0]}.supabase.co:5432/postgres`;

console.log('🔌 Connecting to database...');

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        await client.connect();
        console.log('✅ Connected to database.');

        const sqlPath = path.join(process.cwd(), 'shop_cleanup_migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📜 Executing migration script...');
        await client.query(sql);

        console.log('✨ Migration completed successfully!');
        console.log('   - Removed digital items');
        console.log('   - Dropped price_desideri column');
        console.log('   - Dropped legacy RPC functions');

    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
