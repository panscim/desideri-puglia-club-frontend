import pg from 'pg';
const { Client } = pg;

// Use hardcoded connection string (same as migration)
const DATABASE_URL = 'postgresql://postgres.edzwtxatihiqyvqvqqqe:Desideridipuglia1@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const cards = [
    {
        title: 'Castello Svevo di Barletta',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Castello_di_Barletta.jpg/800px-Castello_di_Barletta.jpg', // Placeholder
        type: 'monument',
        rarity: 'legendary',
        city: 'Barletta',
        gps_lat: 41.3204,
        gps_lng: 16.2891,
        gps_radius: 150,
        description: 'Imponente fortezza normanna-sveva, simbolo della città.',
        points_value: 500
    },
    {
        title: 'Pizzeria Da Gino',
        image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80', // Placeholder
        type: 'partner',
        rarity: 'common',
        city: 'Trani',
        pin_code: '1234',
        description: 'La vera pizza napoletana nel cuore di Trani.',
        points_value: 100
    }
];

async function seed() {
    try {
        await client.connect();
        console.log('✅ Connected to database.');

        for (const card of cards) {
            const { title, image_url, type, rarity, city, gps_lat, gps_lng, gps_radius, pin_code, description, points_value } = card;

            // Check if exists
            const checkRes = await client.query('SELECT id FROM cards WHERE title = $1', [title]);
            if (checkRes.rows.length > 0) {
                console.log(`⚠️ Card "${title}" already exists. Skipping.`);
                continue;
            }

            // Insert
            const query = `
                INSERT INTO cards (title, image_url, type, rarity, city, gps_lat, gps_lng, gps_radius, pin_code, description, points_value)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id;
            `;
            const values = [title, image_url, type, rarity, city, gps_lat, gps_lng, gps_radius, pin_code, description, points_value];

            const res = await client.query(query, values);
            console.log(`✅ Inserted card "${title}" (ID: ${res.rows[0].id})`);
        }

        console.log('🎉 Seeding complete!');

    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        await client.end();
    }
}

seed();
