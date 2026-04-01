import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const tables = [
  'partners',
  'partner_opening_hours',
  'partner_analytics_monthly',
  'partner_events_created',
  'prenotazioni_eventi',
  'booking_payments',
  'cards',
  'user_cards',
  'quest_sets',
  'quest_set_steps',
  'user_quest_sets',
  'user_quest_set_steps',
  'user_quest_favorites',
  'daily_plans',
  'plan_slots',
  'plan_purchases',
  'vibe_reports',
  'creator_applications',
  'market_items',
  'market_orders',
  'market_purchases',
  'partner_offers',
  'vouchers',
  'desideri_movimenti',
  'notifiche',
  'bad_rooms',
  'bad_bookings',
  'bad_room_blocks',
  'user_now_sessions',
];

const functions = [
  'validate_pin_visit',
  'purchase_daily_plan',
  'recalc_desideri_balance',
  'bad_room_is_available',
  'bad_create_booking_with_desideri',
];

const buckets = ['avatars', 'proofs', 'partner_assets', 'partner-logos'];

await client.connect();

const { rows: tableRows } = await client.query(
  "select table_name from information_schema.tables where table_schema='public' and table_name = any($1) order by table_name",
  [tables]
);

const { rows: functionRows } = await client.query(
  "select routine_name from information_schema.routines where routine_schema='public' and routine_name = any($1) order by routine_name",
  [functions]
);

const { rows: bucketRows } = await client.query(
  'select id from storage.buckets where id = any($1) order by id',
  [buckets]
);

console.log(
  JSON.stringify(
    {
      tables: tableRows.map((row) => row.table_name),
      functions: functionRows.map((row) => row.routine_name),
      buckets: bucketRows.map((row) => row.id),
    },
    null,
    2
  )
);

await client.end();
