import { Pool } from "pg";
import {
  RepositorioUsuarios,
  NuevoUsuario,
  TokenVerificacion,
} from "./RepositorioUsuarios";

export class PostgresRepositorio implements RepositorioUsuarios {
  private pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  async existeCorreo(correo: string): Promise<boolean> {
    const r = await this.pool.query("SELECT id FROM usuarios WHERE correo = $1", [correo]);
    return r.rows.length > 0;
  }

  async crearUsuario(u: NuevoUsuario): Promise<number> {
    const r = await this.pool.query(
      `INSERT INTO usuarios (nombre, apellido, correo, edad, password_hash, verificado)
       VALUES ($1, $2, $3, $4, $5, false) RETURNING id`,
      [u.nombre, u.apellido, u.correo, u.edad, u.passwordHash]
    );
    return r.rows[0].id as number;
  }

  async guardarToken(usuarioId: number, token: string, expiraEn: Date): Promise<void> {
    await this.pool.query(
      `INSERT INTO tokens_verificacion (usuario_id, token, expira_en) VALUES ($1, $2, $3)`,
      [usuarioId, token, expiraEn]
    );
  }

  async buscarToken(token: string): Promise<TokenVerificacion | null> {
    const r = await this.pool.query(
      `SELECT id, usuario_id, expira_en, usado FROM tokens_verificacion WHERE token = $1`,
      [token]
    );
    if (r.rows.length === 0) return null;
    const f = r.rows[0];
    return {
      id: f.id,
      usuarioId: f.usuario_id,
      expiraEn: new Date(f.expira_en),
      usado: f.usado,
    };
  }

  async marcarUsuarioVerificado(usuarioId: number): Promise<void> {
    await this.pool.query("UPDATE usuarios SET verificado = true WHERE id = $1", [usuarioId]);
  }

  async marcarTokenUsado(tokenId: number): Promise<void> {
    await this.pool.query("UPDATE tokens_verificacion SET usado = true WHERE id = $1", [tokenId]);
  }
}