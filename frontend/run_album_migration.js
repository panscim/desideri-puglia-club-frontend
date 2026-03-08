import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use connection string from migrate.mjs
const DATABASE_URL = 'postgresql://postgres.edzwtxatihiqyvqvqqqe:Desideridipuglia1@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

async function run() {
    console.log("Using database URL from script...");

    const migrationParams = fs.readFileSync(path.join(__dirname, 'album_migration.sql'), 'utf8');

    const client = new pg.Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to database.");
        await client.query(migrationParams);
        console.log("Migration executed successfully.");
    } catch (err) {
        console.error("Error executing migration:", err);
    } finally {
        await client.end();
    }
}

run();
