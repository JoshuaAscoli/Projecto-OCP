import express, { Request, Response } from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import crypto from "crypto";
import dotenv from "dotenv";
import { obtenerRepositorio } from "./db";
import { enviarCorreoVerificacion } from "./mailer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// La aplicacion depende del contrato RepositorioUsuarios,
// no de Postgres ni de SQLite. La fabrica decide segun DB_ENGINE.
const repo = obtenerRepositorio();

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// --- POST /api/registro ---
app.post("/api/registro", async (req: Request, res: Response) => {
  const { nombre, apellido, correo, edad, password } = req.body;

  // Validacion en el servidor: nunca confies solo en el frontend.
  if (!nombre || !apellido || !correo || !edad || !password) {
    return res.status(400).json({ mensaje: "Faltan campos requeridos." });
  }
  const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!correoRegex.test(correo)) {
    return res.status(400).json({ mensaje: "Correo invalido." });
  }
  if (Number(edad) < 18 || Number(edad) > 100) {
    return res.status(400).json({ mensaje: "La edad debe estar entre 18 y 100." });
  }

  const passwordFuerte = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/;
  if (!passwordFuerte.test(password)) {
    return res.status(400).json({
      mensaje:
        "La contraseña debe tener 10+ caracteres, una mayúscula, un número y un símbolo.",
    });
  }

  try {
    if (await repo.existeCorreo(correo)) {
      return res.status(409).json({ mensaje: "Ese correo ya esta registrado." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const usuarioId = await repo.crearUsuario({
      nombre,
      apellido,
      correo,
      edad: Number(edad),
      passwordHash,
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiraEn = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await repo.guardarToken(usuarioId, token, expiraEn);

    await enviarCorreoVerificacion(correo, nombre, token);

    return res.status(201).json({
      mensaje: "Usuario creado. Revisa tu correo para verificar la cuenta.",
    });
  } catch (error) {
    console.error("Error en /api/registro:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
});

// --- GET /api/verificar?token=... ---
app.get("/api/verificar", async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ mensaje: "Token invalido." });
  }

  try {
    const registro = await repo.buscarToken(token);

    if (!registro) {
      return res.status(404).json({ mensaje: "Token no encontrado." });
    }
    if (registro.usado) {
      return res.status(400).json({ mensaje: "Este token ya fue usado." });
    }
    if (registro.expiraEn < new Date()) {
      return res.status(400).json({ mensaje: "Este token ya expiro." });
    }

    await repo.marcarUsuarioVerificado(registro.usuarioId);
    await repo.marcarTokenUsado(registro.id);

    return res.json({ mensaje: "Cuenta verificada correctamente." });
  } catch (error) {
    console.error("Error en /api/verificar:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});