import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function enviarCorreoVerificacion(
  destinatario: string,
  nombre: string,
  token: string
) {
  const urlVerificacion = `${process.env.FRONTEND_URL}/verificar?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: destinatario,
    subject: "Confirma tu cuenta",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hola ${nombre},</h2>
        <p>Gracias por registrarte. Confirma tu cuenta haciendo clic en el siguiente enlace:</p>
        <p>
          <a href="${urlVerificacion}" style="background:#B4552D;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
            Verificar mi cuenta
          </a>
        </p>
        <p>Este enlace expira en 24 horas. Si tú no creaste esta cuenta, ignora este correo.</p>
      </div>
    `,
  });
}
