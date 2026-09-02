import { RepositorioUsuarios } from "./RepositorioUsuarios";
import { PostgresRepositorio } from "./PostgresRepositorio";
import { SqliteRepositorio } from "./SqliteRepositorio";

export function obtenerRepositorio(): RepositorioUsuarios {
  switch ((process.env.DB_ENGINE || "postgres").toLowerCase()) {
    case "sqlite":
      return new SqliteRepositorio();
    default:
      return new PostgresRepositorio();
  }
}

export * from "./RepositorioUsuarios";