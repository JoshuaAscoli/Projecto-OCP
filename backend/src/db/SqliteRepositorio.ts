import { DatabaseSync } from "node:sqlite";
import {
  RepositorioUsuarios,
  NuevoUsuario,
  TokenVerificacion,
} from "./RepositorioUsuarios";

export class SqliteRepositorio implements RepositorioUsuarios {
  private db = new DatabaseSync(process.env.SQLITE_FILE || "registro.db");

  constructor() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        correo TEXT UNIQUE NOT NULL,
        edad INTEGER NOT NULL,
        password_hash TEXT NOT NULL,
        verificado INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS tokens_verificacion (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expira_en TEXT NOT NULL,
        usado INTEGER NOT NULL DEFAULT 0
      );
    `);
  }

  async existeCorreo(correo: string): Promise<boolean> {
    const f = this.db.prepare("SELECT id FROM usuarios WHERE correo = ?").get(correo);
    return f !== undefined;
  }

  async crearUsuario(u: NuevoUsuario): Promise<number> {
    const r = this.db
      .prepare(
        `INSERT INTO usuarios (nombre, apellido, correo, edad, password_hash, verificado)
         VALUES (?, ?, ?, ?, ?, 0)`
      )
      .run(u.nombre, u.apellido, u.correo, u.edad, u.passwordHash);
    return Number(r.lastInsertRowid);
  }

  async guardarToken(usuarioId: number, token: string, expiraEn: Date): Promise<void> {
    this.db
      .prepare(`INSERT INTO tokens_verificacion (usuario_id, token, expira_en) VALUES (?, ?, ?)`)
      .run(usuarioId, token, expiraEn.toISOString());
  }

  async buscarToken(token: string): Promise<TokenVerificacion | null> {
    const f: any = this.db
      .prepare(`SELECT id, usuario_id, expira_en, usado FROM tokens_verificacion WHERE token = ?`)
      .get(token);
    if (!f) return null;
    return {
      id: Number(f.id),
      usuarioId: Number(f.usuario_id),
      expiraEn: new Date(f.expira_en),
      usado: f.usado === 1,
    };
  }

  async marcarUsuarioVerificado(usuarioId: number): Promise<void> {
    this.db.prepare("UPDATE usuarios SET verificado = 1 WHERE id = ?").run(usuarioId);
  }

  async marcarTokenUsado(tokenId: number): Promise<void> {
    this.db.prepare("UPDATE tokens_verificacion SET usado = 1 WHERE id = ?").run(tokenId);
  }
}