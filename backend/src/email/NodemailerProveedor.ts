import nodemailer from "nodemailer";
import { ProveedorCorreo, CorreoSalida } from "./ProveedorCorreo";

export class NodemailerProveedor implements ProveedorCorreo {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  async enviar(correo: CorreoSalida): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: correo.para,
      subject: correo.asunto,
      html: correo.html,
    });
  }
}