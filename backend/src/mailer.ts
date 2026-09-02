import dotenv from "dotenv";
import { obtenerProveedorCorreo } from "./email";

dotenv.config();

const proveedor = obtenerProveedorCorreo();

function plantillaVerificacion(nombre: string, url: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Hola ${nombre},</h2>
      <p>Gracias por registrarte. Confirma tu cuenta haciendo clic en el siguiente enlace:</p>
      <p>
        <a href="${url}" style="background:#B4552D;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
          Verificar mi cuenta
        </a>
      </p>
      <p>Este enlace expira en 24 horas. Si tú no creaste esta cuenta, ignora este correo.</p>
    </div>
  `;
}

export async function enviarCorreoVerificacion(
  destinatario: string,
  nombre: string,
  token: string
) {
  const url = `${process.env.FRONTEND_URL}/verificar?token=${token}`;
  await proveedor.enviar({
    para: destinatario,
    asunto: "Confirma tu cuenta",
    html: plantillaVerificacion(nombre, url),
  });
}