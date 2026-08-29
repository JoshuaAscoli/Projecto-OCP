import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Neon requiere SSL. rejectUnauthorized: false evita problemas
// con el certificado en desarrollo local.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
