export interface CorreoSalida {
  para: string;
  asunto: string;
  html: string;
}

// Cualquier proveedor de correo debe cumplir este contrato.
export interface ProveedorCorreo {
  enviar(correo: CorreoSalida): Promise<void>;
}