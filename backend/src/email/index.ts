import { ProveedorCorreo } from "./ProveedorCorreo";
import { NodemailerProveedor } from "./NodemailerProveedor";
import { ResendProveedor } from "./ResendProveedor";

export function obtenerProveedorCorreo(): ProveedorCorreo {
  switch ((process.env.EMAIL_PROVIDER || "smtp").toLowerCase()) {
    case "resend":
      return new ResendProveedor();
    default:
      return new NodemailerProveedor();
  }
}

export * from "./ProveedorCorreo";