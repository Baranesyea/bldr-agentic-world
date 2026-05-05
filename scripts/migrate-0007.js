const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL env var required');
  process.exit(1);
}

const sql = postgres(url);

(async () => {
  const file = path.join(__dirname, '..', 'drizzle', '0007_cancellation_completed.sql');
  const stmt = fs.readFileSync(file, 'utf8');
  await sql.unsafe(stmt);
  const r = await sql.unsafe(
    "SELECT column_name FROM information_schema.columns WHERE table_name='members' AND column_name='cancellation_completed_at';"
  );
  console.log('verified column:', r);
  process.exit(0);
})().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
