export interface NuevoUsuario {
  nombre: string;
  apellido: string;
  correo: string;
  edad: number;
  passwordHash: string;
}

export interface TokenVerificacion {
  id: number;
  usuarioId: number;
  expiraEn: Date;
  usado: boolean;
}

// Todo lo que la aplicacion necesita de una base de datos.
// Ningun metodo menciona SQL, Postgres ni SQLite.
export interface RepositorioUsuarios {
  existeCorreo(correo: string): Promise<boolean>;
  crearUsuario(usuario: NuevoUsuario): Promise<number>;
  guardarToken(usuarioId: number, token: string, expiraEn: Date): Promise<void>;
  buscarToken(token: string): Promise<TokenVerificacion | null>;
  marcarUsuarioVerificado(usuarioId: number): Promise<void>;
  marcarTokenUsado(tokenId: number): Promise<void>;
}