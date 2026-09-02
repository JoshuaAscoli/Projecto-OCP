import React, { useState } from "react";

// Componente de formulario de registro de usuarios.
// Pensado para conectarse a un endpoint tipo POST /api/registro
// que crea el usuario y dispara el correo de verificación.

interface FormState {
  nombre: string;
  apellido: string;
  correo: string;
  edad: string;
  password: string;
  confirmarPassword: string;
}

type Errores = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  nombre: "",
  apellido: "",
  correo: "",
  edad: "",
  password: "",
  confirmarPassword: "",
};

function validar(form: FormState): Errores {
  const errores: Errores = {};

  if (!form.nombre.trim()) errores.nombre = "Ingresa tu nombre.";
  if (!form.apellido.trim()) errores.apellido = "Ingresa tu apellido.";

  const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!correoRegex.test(form.correo)) {
    errores.correo = "Ingresa un correo válido.";
  }

    const edadNum = Number(form.edad);
  if (!form.edad || isNaN(edadNum) || edadNum < 18 || edadNum > 100) {
    errores.edad = "Debes tener entre 18 y 100 años para registrarte.";
  }

  if (form.password.length < 10) {
    errores.password = "La contraseña debe tener al menos 10 caracteres.";
  } else if (
    !/[A-Z]/.test(form.password) ||
    !/[0-9]/.test(form.password) ||
    !/[^A-Za-z0-9]/.test(form.password)
  ) {
    errores.password = "Incluye una mayúscula, un número y un símbolo.";
  }

  if (form.confirmarPassword !== form.password) {
    errores.confirmarPassword = "Las contraseñas no coinciden.";
  }

  return errores;
}

export default function RegistroForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState<"exito" | "error" | null>(null);
  const [mensajeServidor, setMensajeServidor] = useState("");

  function actualizarCampo(campo: keyof FormState, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: undefined }));
    }
  }

  async function manejarEnvio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const erroresValidacion = validar(form);
    setErrores(erroresValidacion);
    if (Object.keys(erroresValidacion).length > 0) return;

    setEnviando(true);
    setEstado(null);
    setMensajeServidor("");

    try {
      // Ajusta la URL al endpoint real de tu backend.
      const respuesta = await fetch("http://localhost:4000/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          apellido: form.apellido,
          correo: form.correo,
          edad: Number(form.edad),
          password: form.password,
        }),
      });

      const data = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(data.mensaje || "No se pudo completar el registro.");
      }

      setEstado("exito");
      setForm(initialForm);
    } catch (err) {
      setEstado("error");
      setMensajeServidor(
        err instanceof Error ? err.message : "Ocurrió un error inesperado."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (estado === "exito") {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.title}>Revisa tu correo</h2>
          <p style={styles.subtitle}>
            Te enviamos un enlace de verificación. Ábrelo para activar tu
            cuenta antes de iniciar sesión.
          </p>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => setEstado(null)}
          >
            Registrar otra cuenta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <form style={styles.card} onSubmit={manejarEnvio} noValidate>
        <h2 style={styles.title}>Crear cuenta</h2>
        <p style={styles.subtitle}>
          Completa tus datos. Te enviaremos un correo para confirmar tu
          cuenta.
        </p>

        <div style={styles.row}>
          <Campo
            label="Nombre"
            value={form.nombre}
            onChange={(v) => actualizarCampo("nombre", v)}
            error={errores.nombre}
            autoComplete="given-name"
          />
          <Campo
            label="Apellido"
            value={form.apellido}
            onChange={(v) => actualizarCampo("apellido", v)}
            error={errores.apellido}
            autoComplete="family-name"
          />
        </div>

        <Campo
          label="Correo electrónico"
          type="email"
          value={form.correo}
          onChange={(v) => actualizarCampo("correo", v)}
          error={errores.correo}
          autoComplete="email"
        />

        <Campo
          label="Edad"
          type="number"
          value={form.edad}
          onChange={(v) => actualizarCampo("edad", v)}
          error={errores.edad}
        />

        <Campo
          label="Contraseña"
          type="password"
          value={form.password}
          onChange={(v) => actualizarCampo("password", v)}
          error={errores.password}
          autoComplete="new-password"
            hint="Mínimo 10 caracteres, con mayúscula, número y símbolo."
        />

        <Campo
          label="Confirmar contraseña"
          type="password"
          value={form.confirmarPassword}
          onChange={(v) => actualizarCampo("confirmarPassword", v)}
          error={errores.confirmarPassword}
          autoComplete="new-password"
        />

        {estado === "error" && (
          <div style={styles.errorBanner}>{mensajeServidor}</div>
        )}

        <button type="submit" style={styles.button} disabled={enviando}>
          {enviando ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}

interface CampoProps {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  hint?: string;
}

function Campo({
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  hint,
}: CampoProps) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        style={{
          ...styles.input,
          borderColor: error ? "#D14343" : "#D8D3C9",
        }}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && !error && <span style={styles.hint}>{hint}</span>}
      {error && <span style={styles.errorText}>{error}</span>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F5F3EE",
    padding: "24px",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#FFFFFF",
    borderRadius: "16px",
    padding: "32px",
    boxShadow: "0 1px 2px rgba(20,20,20,0.04), 0 8px 24px rgba(20,20,20,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
    color: "#1F1B16",
  },
  subtitle: {
    margin: "4px 0 20px",
    fontSize: "14px",
    color: "#6B6459",
    lineHeight: 1.5,
  },
  row: {
    display: "flex",
    gap: "12px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "14px",
    flex: 1,
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#3A352C",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #D8D3C9",
    fontSize: "14px",
    outline: "none",
    background: "#FCFBF9",
    color: "#1F1B16",
  },
  hint: {
    fontSize: "12px",
    color: "#8A8375",
  },
  errorText: {
    fontSize: "12px",
    color: "#D14343",
  },
  errorBanner: {
    background: "#FBEAEA",
    color: "#B03030",
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "12px",
  },
  button: {
    marginTop: "8px",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#B4552D",
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    marginTop: "16px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #D8D3C9",
    background: "transparent",
    color: "#3A352C",
    fontSize: "14px",
    cursor: "pointer",
  },
  successIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#E4F1E9",
    color: "#2F8F5C",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    marginBottom: "12px",
  },
};
