import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Use session pooler (port 5432) instead of transaction pooler (port 6543)
// Transaction pooler breaks multi-query operations like insert chapter + insert lessons
const connectionString = (process.env.DATABASE_URL || "").replace(":6543/", ":5432/");

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
