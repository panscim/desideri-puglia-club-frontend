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
        title: 'Trulli di Alberobello',
        image_url: 'https://images.unsplash.com/photo-1626084606766-3c0e35327916?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'legendary',
        city: 'Alberobello',
        gps_lat: 40.7831,
        gps_lng: 17.2374,
        description: 'Le iconiche abitazioni in pietra a secco, patrimonio UNESCO.',
        points_value: 500
    },
    {
        title: 'Lama Monachile',
        image_url: 'https://images.unsplash.com/photo-1543789392-7f7243c9780a?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'legendary',
        city: 'Polignano a Mare',
        gps_lat: 40.9964,
        gps_lng: 17.2196,
        description: 'La celebre cala incastonata tra le scogliere di Polignano.',
        points_value: 500
    },
    {
        title: 'Cattedrale di Trani',
        image_url: 'https://images.unsplash.com/photo-1627993430623-fb713364df24?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'rare',
        city: 'Trani',
        gps_lat: 41.2825,
        gps_lng: 16.4184,
        description: 'La cattedrale sul mare, capolavoro del romanico pugliese.',
        points_value: 300
    },
    {
        title: 'Castel del Monte',
        image_url: 'https://images.unsplash.com/photo-1596485077271-70e176378415?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'legendary',
        city: 'Andria',
        gps_lat: 41.0847,
        gps_lng: 16.2709,
        description: 'L\'enigmatica fortezza ottagonale di Federico II.',
        points_value: 500
    },
    {
        title: 'Basilica di Santa Croce',
        image_url: 'https://images.unsplash.com/photo-1601389814456-4c4e72322055?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'rare',
        city: 'Lecce',
        gps_lat: 40.3533,
        gps_lng: 18.1738,
        description: 'Il trionfo del barocco leccese con la sua facciata ricamata.',
        points_value: 350
    },
    {
        title: 'Anfiteatro Romano',
        image_url: 'https://images.unsplash.com/photo-1623861273934-2e0e014e7432?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'rare',
        city: 'Lecce',
        gps_lat: 40.3522,
        gps_lng: 18.1691,
        description: 'Antico teatro romano nel cuore di Piazza Sant\'Oronzo.',
        points_value: 300
    },
    {
        title: 'Cava di Bauxite',
        image_url: 'https://images.unsplash.com/photo-1618335349378-b118749e4939?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'common',
        city: 'Otranto',
        gps_lat: 40.1331,
        gps_lng: 18.5006,
        description: 'Un lago verde smeraldo circondato da terra rossa.',
        points_value: 200
    },
    {
        title: 'Castello Aragonese',
        image_url: 'https://images.unsplash.com/photo-1623783777708-54c30c885368?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'rare',
        city: 'Otranto',
        gps_lat: 40.1456,
        gps_lng: 18.4925,
        description: 'Imponente fortificazione che domina il porto di Otranto.',
        points_value: 300
    },
    {
        title: 'Pizzomunno',
        image_url: 'https://images.unsplash.com/photo-1625828230555-585804246695?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'common',
        city: 'Vieste',
        gps_lat: 41.8797,
        gps_lng: 16.1756,
        description: 'Il gigantesco monolite bianco simbolo di Vieste.',
        points_value: 200
    },
    {
        title: 'Cattedrale di Ostuni',
        image_url: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'rare',
        city: 'Ostuni',
        gps_lat: 40.7303,
        gps_lng: 17.5794,
        description: 'La cattedrale gotica che svetta sulla Città Bianca.',
        points_value: 300
    },
    {
        title: 'Castello di Monopoli',
        image_url: 'https://images.unsplash.com/photo-1624022067710-1c0c16999677?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'common',
        city: 'Monopoli',
        gps_lat: 40.9535,
        gps_lng: 17.3060,
        description: 'Il castello Carlo V sul promontorio di Punta Penna.',
        points_value: 200
    },
    {
        title: 'Ponte Acquedotto',
        image_url: 'https://images.unsplash.com/photo-1658428236162-811c7db52047?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'common',
        city: 'Gravina in Puglia',
        gps_lat: 40.8197,
        gps_lng: 16.4158,
        description: 'Suggestivo ponte che attraversa la gravina, set di 007.',
        points_value: 250
    },
    {
        title: 'Santuario di San Michele',
        image_url: 'https://images.unsplash.com/photo-1629817296082-96c21e64627b?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'legendary',
        city: 'Monte Sant\'Angelo',
        gps_lat: 41.7077,
        gps_lng: 15.9556,
        description: 'Antichissimo santuario micaelico, patrimonio UNESCO.',
        points_value: 500
    },
    {
        title: 'Castello Aragonese',
        image_url: 'https://images.unsplash.com/photo-1596815857218-clbe8c8e7669?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'rare',
        city: 'Taranto',
        gps_lat: 40.4735,
        gps_lng: 17.2307,
        description: 'Fortezza sul mare a difesa del canale navigabile.',
        points_value: 350
    },
    {
        title: 'Colonna Romana',
        image_url: 'https://images.unsplash.com/photo-1625906663231-1e9672051280?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'common',
        city: 'Brindisi',
        gps_lat: 40.6406,
        gps_lng: 17.9455,
        description: 'Terminale della via Appia, simbolo della città.',
        points_value: 200
    },
    {
        title: 'Scavi di Egnazia',
        image_url: 'https://images.unsplash.com/photo-1616766467389-98335011986c?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'rare',
        city: 'Fasano',
        gps_lat: 40.8876,
        gps_lng: 17.3917,
        description: 'Resti di un\'antica città messapica e romana sul mare.',
        points_value: 300
    },
    {
        title: 'Basilica di San Nicola',
        image_url: 'https://images.unsplash.com/photo-1563816669-e7d6928e08d6?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'legendary',
        city: 'Bari',
        gps_lat: 41.1301,
        gps_lng: 16.8706,
        description: 'Capolavoro romanico che custodisce le reliquie del Santo.',
        points_value: 500
    },
    {
        title: 'Teatro Petruzzelli',
        image_url: 'https://images.unsplash.com/photo-1579975095995-16353d995cb4?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'rare',
        city: 'Bari',
        gps_lat: 41.1232,
        gps_lng: 16.8725,
        description: 'Uno dei teatri più grandi e belli d\'Italia.',
        points_value: 400
    },
    {
        title: 'Grotta della Poesia',
        image_url: 'https://images.unsplash.com/photo-1560965319-fc41d184715f?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'common',
        city: 'Melendugno',
        gps_lat: 40.2858,
        gps_lng: 18.4286,
        description: 'Piscina naturale di straordinaria bellezza.',
        points_value: 250
    },
    {
        title: 'Faro di Santa Maria di Leuca',
        image_url: 'https://images.unsplash.com/photo-1566378457-3a17e0b23269?auto=format&fit=crop&w=800&q=80',
        type: 'monument',
        rarity: 'legendary',
        city: 'Leuca',
        gps_lat: 39.7963,
        gps_lng: 18.3626,
        description: 'Il punto più a sud del tacco d\'Italia, dove i mari si incontrano.',
        points_value: 500
    }
];

async function seed() {
    try {
        await client.connect();
        console.log('✅ Connected to database.');

        // Verify/Create table just in case (optional, but good for safety)
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.cards (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                title TEXT NOT NULL,
                image_url TEXT,
                type TEXT NOT NULL CHECK (type IN ('monument', 'partner')),
                rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'legendary')),
                city TEXT,
                gps_lat DOUBLE PRECISION,
                gps_lng DOUBLE PRECISION,
                gps_radius INTEGER DEFAULT 100,
                pin_code TEXT,
                description TEXT,
                points_value INTEGER DEFAULT 100,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
        `);

        for (const card of cards) {
            const { title, image_url, type, rarity, city, gps_lat, gps_lng, description, points_value } = card;

            // Check if exists by title, avoiding duplicates
            const checkRes = await client.query('SELECT id FROM cards WHERE title = $1', [title]);
            if (checkRes.rows.length > 0) {
                console.log(`⚠️ Card "${title}" already exists. Skipping.`);
                continue;
            }

            // Insert
            const query = `
                INSERT INTO cards (title, image_url, type, rarity, city, gps_lat, gps_lng, description, points_value)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id;
            `;
            const values = [title, image_url, type, rarity, city, gps_lat, gps_lng, description, points_value];

            const res = await client.query(query, values);
            console.log(`✅ Inserted card "${title}" (ID: ${res.rows[0].id})`);
        }

        console.log('🎉 Seeding complete! 20 new cards added.');

    } catch (err) {
        console.error('❌ Seeding failed:', err);
    } finally {
        await client.end();
    }
}

seed();
