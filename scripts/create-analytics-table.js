const postgres = require('postgres');
const sql = postgres('postgresql://postgres.exzkttttnsnpwzouwiqq:The%40gentic3orldPa5%24@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres');

async function run() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email VARCHAR(255),
      event_type VARCHAR(50) NOT NULL,
      event_data JSONB DEFAULT '{}',
      device_type VARCHAR(20),
      user_agent TEXT,
      session_id VARCHAR(100),
      page_url TEXT,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_email);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
  `);

  console.log('analytics_events table and indexes created!');
  process.exit(0);
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
