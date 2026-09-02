import express, { Request, Response } from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import crypto from "crypto";
import dotenv from "dotenv";
import { pool } from "./db";
import { enviarCorreoVerificacion } from "./mailer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

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
    const existente = await pool.query(
      "SELECT id FROM usuarios WHERE correo = $1",
      [correo]
    );
    if (existente.rows.length > 0) {
      return res.status(409).json({ mensaje: "Ese correo ya esta registrado." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, correo, edad, password_hash, verificado)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING id`,
      [nombre, apellido, correo, edad, passwordHash]
    );
    const usuarioId = resultado.rows[0].id;

    const token = crypto.randomBytes(32).toString("hex");
    const expiraEn = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await pool.query(
      `INSERT INTO tokens_verificacion (usuario_id, token, expira_en)
       VALUES ($1, $2, $3)`,
      [usuarioId, token, expiraEn]
    );

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
    const resultado = await pool.query(
      `SELECT id, usuario_id, expira_en, usado FROM tokens_verificacion WHERE token = $1`,
      [token]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: "Token no encontrado." });
    }

    const tokenRow = resultado.rows[0];

    if (tokenRow.usado) {
      return res.status(400).json({ mensaje: "Este token ya fue usado." });
    }
    if (new Date(tokenRow.expira_en) < new Date()) {
      return res.status(400).json({ mensaje: "Este token ya expiro." });
    }

    await pool.query("UPDATE usuarios SET verificado = true WHERE id = $1", [
      tokenRow.usuario_id,
    ]);
    await pool.query(
      "UPDATE tokens_verificacion SET usado = true WHERE id = $1",
      [tokenRow.id]
    );

    return res.json({ mensaje: "Cuenta verificada correctamente." });
  } catch (error) {
    console.error("Error en /api/verificar:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
