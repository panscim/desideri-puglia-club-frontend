import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres.edzwtxatihiqyvqvqqqe:Desideridipuglia1@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';
const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    const partnerId = 'fd102bbb-801a-4277-96f7-fe125ed86a31';
    console.log(`Cleaning up database for partner ID: ${partnerId}`);

    try {
        await client.connect();
        
        // Disable foreign key checks for a moment or delete in order
        await client.query('BEGIN');

        console.log("Deleting partner_analytics_monthly...");
        await client.query('DELETE FROM partner_analytics_monthly WHERE partner_id = $1', [partnerId]);

        console.log("Deleting logs_transazioni...");
        await client.query('DELETE FROM logs_transazioni WHERE partner_id = $1', [partnerId]);

        console.log("Deleting booking_payments...");
        await client.query('DELETE FROM booking_payments WHERE partner_id = $1', [partnerId]);

        console.log("Deleting prenotazioni_eventi for partner events...");
        await client.query(`
            DELETE FROM prenotazioni_eventi 
            WHERE event_id IN (SELECT id FROM partner_events_created WHERE partner_id = $1)
        `, [partnerId]);

        console.log("Deleting partner_events_created...");
        await client.query('DELETE FROM partner_events_created WHERE partner_id = $1', [partnerId]);

        console.log("Resetting partner_id in utenti...");
        await client.query('UPDATE utenti SET partner_id = NULL WHERE partner_id = $1', [partnerId]);

        console.log("Deleting partner record from partners...");
        await client.query('DELETE FROM partners WHERE id = $1', [partnerId]);

        await client.query('COMMIT');
        console.log("✅ Deletion completed successfully.");

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ Deletion failed:", e);
    } finally {
        await client.end();
    }
}

main();
