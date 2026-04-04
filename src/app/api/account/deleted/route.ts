import { NextResponse } from "next/server";

export async function GET() {
  try {
    const postgres = (await import("postgres")).default;
    const sql = postgres(process.env.DATABASE_URL!);

    const rows = await sql`
      SELECT id, email, full_name, user_type, deleted_by, deleted_at
      FROM deleted_accounts
      ORDER BY deleted_at DESC
    `;

    await sql.end();
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
