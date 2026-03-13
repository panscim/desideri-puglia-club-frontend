import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.edzwtxatihiqyvqvqqqe:Desideridipuglia1@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';
const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        await client.connect();
        const { rows } = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'partners'
        `);
        console.log("Columns in 'partners' table:");
        console.dir(rows);
    } catch (e) {
        console.error("Failed to fetch schema:", e);
    } finally {
        await client.end();
    }
}

main();
