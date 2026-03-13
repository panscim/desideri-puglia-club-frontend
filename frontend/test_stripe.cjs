async function main() {
    console.log("Calling Vercel Prod API for detailed error inspection...");
    try {
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
        const text = await prodRes.text();
        console.log("Status:", prodRes.status);
        console.log("Body text:", text);
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}
main();
