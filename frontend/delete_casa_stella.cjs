const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const partnerId = 'fd102bbb-801a-4277-96f7-fe125ed86a31';
    console.log(`Starting safe deletion for partner ID: ${partnerId}`);

    try {
        // 1. Delete analytics
        console.log("Deleting partner_analytics_monthly...");
        await supabase.from('partner_analytics_monthly').delete().eq('partner_id', partnerId);

        // 2. Delete transaction logs
        console.log("Deleting logs_transazioni...");
        await supabase.from('logs_transazioni').delete().eq('partner_id', partnerId);

        // 3. Delete booking payments
        console.log("Deleting booking_payments...");
        await supabase.from('booking_payments').delete().eq('partner_id', partnerId);

        // 4. Delete bookings for events created by this partner
        console.log("Deleting bookings for partner events...");
        const { data: events } = await supabase.from('partner_events_created').select('id').eq('partner_id', partnerId);
        if (events && events.length > 0) {
            const eventIds = events.map(e => e.id);
            await supabase.from('prenotazioni_eventi').delete().in('event_id', eventIds);
            
            // 5. Delete events
            console.log("Deleting partner_events_created...");
            await supabase.from('partner_events_created').delete().eq('partner_id', partnerId);
        }

        // 6. Delete the partner itself
        console.log("Deleting partner record...");
        const { error } = await supabase.from('partners').delete().eq('id', partnerId);

        if (error) {
            console.error("Error deleting partner:", error.message);
        } else {
            console.log("Partner 'Casa stella' and all related data deleted successfully.");
        }

        // 7. (Optional) Reset partner_id in 'utenti' if it was set
        console.log("Resetting partner_id in 'utenti'...");
        await supabase.from('utenti').update({ partner_id: null }).eq('partner_id', partnerId);

    } catch (e) {
        console.error("Deletion failed:", e);
    }
}

main();
