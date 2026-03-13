const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
    const { data: partner } = await supabase
        .from('partners')
        .select('id, name, stripe_account_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!partner || !partner.stripe_account_id) {
        console.error("No partner or stripe_account_id found.");
        return;
    }

    console.log(`Checking Stripe Account: ${partner.stripe_account_id} for Partner: ${partner.name}`);
    
    try {
        const account = await stripe.accounts.retrieve(partner.stripe_account_id);
        console.log("--- STRIPE ACCOUNT SUMMARY ---");
        console.log("ID:", account.id);
        console.log("Charges Enabled:", account.charges_enabled);
        console.log("Payouts Enabled:", account.payouts_enabled);
        console.log("Details Submitted:", account.details_submitted);
        console.log("Capabilities:", JSON.stringify(account.capabilities, null, 2));
        console.log("Requirements (Currently Due):", JSON.stringify(account.requirements.currently_due, null, 2));
        console.log("Requirements (Eventually Due):", JSON.stringify(account.requirements.eventually_due, null, 2));
        console.log("Requirements (Errors):", JSON.stringify(account.requirements.errors, null, 2));
        console.log("------------------------------");
    } catch (e) {
        console.error("Stripe Error:", e.message);
    }
}
main();
