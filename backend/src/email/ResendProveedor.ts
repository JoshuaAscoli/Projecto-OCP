import { Resend } from "resend";
import { ProveedorCorreo, CorreoSalida } from "./ProveedorCorreo";

export class ResendProveedor implements ProveedorCorreo {
  private cliente = new Resend(process.env.RESEND_API_KEY);

  async enviar(correo: CorreoSalida): Promise<void> {
    const { error } = await this.cliente.emails.send({
      from: process.env.MAIL_FROM || "onboarding@resend.dev",
      to: correo.para,
      subject: correo.asunto,
      html: correo.html,
    });
    if (error) throw new Error(`Resend fallo: ${error.message}`);
  }
}