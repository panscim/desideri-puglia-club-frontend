const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // Unfortunately we can't query pg_proc via REST API as a client easily.
    // Let's test the endpoint directly to see the exact response
    const res = await fetch('http://localhost:3000/api/create-partner-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: '3d059993-5f6c-41ef-87cb-37da52290dd8',
            tier: 'pro',
            successUrl: 'http://localhost/ok',
            cancelUrl: 'http://localhost/ko'
        })
    });
    
    // Fallback: use production URL if localhost fails and we just want to see the error
    const prodRes = await fetch('https://desideri-puglia-club-frontend.vercel.app/api/create-partner-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': 'https://desideri-puglia-club-frontend.vercel.app' },
        body: JSON.stringify({
            userId: '3d059993-5f6c-41ef-87cb-37da52290dd8',
            tier: 'pro',
            successUrl: 'http://localhost/ok',
            cancelUrl: 'http://localhost/ko'
        })
    });
    
    console.log("Prod Res:", await prodRes.text());
}
main();
