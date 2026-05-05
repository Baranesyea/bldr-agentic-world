const postgres = require('postgres');
const url = process.env.DATABASE_URL;
const sql = postgres(url);
(async () => {
  const r = await sql.unsafe(
    "SELECT email, billing_cycle, price_paid, subscription_started_at, cancellation_requested_at, cancellation_completed_at FROM members WHERE email = 'i@become.co.il';"
  );
  console.log(r);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
