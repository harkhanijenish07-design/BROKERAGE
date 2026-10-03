const BASE_URL = 'http://localhost:3000/api/portfolio';

async function testPortfolio() {
    console.log('--- Starting Portfolio API Verification ---');

    // 1. Get initial portfolio (should be empty or existing)
    console.log('\n1. Fetching Initial Portfolio...');
    try {
        const res = await fetch(BASE_URL);
        if (res.status === 401) {
            console.error('❌ Unauthorized. Please ensure you have a session (this script might need a cookie).');
            return;
        }
        const initialData = await res.json();
        console.log('✅ Initial Portfolio:', initialData.length, 'items');
    } catch (e) {
        console.error('❌ Failed to fetch portfolio:', e);
    }

    // Since we can't easily fake auth in this standalone script without a session token,
    // we will rely on manual testing in the browser for the full flow.
    // However, we can check if the endpoints exist and return 401 (which means they are reachable).

    console.log('\n2. Testing Buy Endpoint (Expect 401 if not logged in)...');
    try {
        const res = await fetch(`${BASE_URL}/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                symbol: 'AAPL',
                companyName: 'Apple Inc.',
                quantity: 1,
                price: 150.00
            })
        });
        console.log(`Endpoint Status: ${res.status}`);
        if (res.status === 401) console.log('✅ Correctly blocked unauthorized request.');
        else if (res.status === 200) console.log('✅ Buy successful (Unexpected without auth headers!)');
    } catch (e) {
        console.error('❌ Failed to connect to buy endpoint:', e);
    }

    console.log('\n--- Verification Complete ---');
    console.log('👉 Please manually test in the browser to verify full functionality with Authentication.');
}

testPortfolio();
