import { useEffect, useRef, useState } from "react";

type Estado = "verificando" | "exito" | "ya_verificado" | "error";

export default function VerificarCuenta() {
  const [estado, setEstado] = useState<Estado>("verificando");
  const [mensaje, setMensaje] = useState("Verificando tu cuenta...");
  const yaEjecutado = useRef(false);

  useEffect(() => {
    // Evita que la doble ejecucion de useEffect en modo desarrollo
    // (React.StrictMode) mande la verificacion dos veces.
    if (yaEjecutado.current) return;
    yaEjecutado.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setEstado("error");
      setMensaje("No se encontró un token de verificación en el enlace.");
      return;
    }

    fetch(`http://localhost:4000/api/verificar?token=${token}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          // Si el token ya fue usado, es porque la cuenta ya quedo
          // verificada antes (por ejemplo, se abrio el link dos veces).
          if (data.mensaje === "Este token ya fue usado.") {
            setEstado("ya_verificado");
            setMensaje("Tu cuenta ya había sido verificada.");
            return;
          }
          throw new Error(data.mensaje || "No se pudo verificar la cuenta.");
        }

        setEstado("exito");
        setMensaje(data.mensaje || "Cuenta verificada correctamente.");
      })
      .catch((err) => {
        setEstado("error");
        setMensaje(err.message || "Ocurrió un error inesperado.");
      });
  }, []);

  const esExito = estado === "exito" || estado === "ya_verificado";

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div
          style={{
            ...styles.icon,
            background: estado === "error" ? "#FBEAEA" : "#E4F1E9",
            color: estado === "error" ? "#B03030" : "#2F8F5C",
          }}
        >
          {estado === "verificando" ? "…" : esExito ? "✓" : "✕"}
        </div>
        <h2 style={styles.title}>
          {estado === "verificando"
            ? "Verificando..."
            : estado === "exito"
            ? "¡Cuenta verificada!"
            : estado === "ya_verificado"
            ? "Ya has sido verificado"
            : "No se pudo verificar"}
        </h2>
        <p style={styles.subtitle}>{mensaje}</p>

        {estado !== "verificando" && (
          <button
            style={styles.button}
            onClick={() => (window.location.href = "/")}
          >
            Registrar otro usuario
          </button>
        )}
      </div>
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
    textAlign: "center",
    boxShadow: "0 1px 2px rgba(20,20,20,0.04), 0 8px 24px rgba(20,20,20,0.06)",
  },
  icon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    margin: "0 auto 16px",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#1F1B16",
  },
  subtitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: "#6B6459",
    lineHeight: 1.5,
  },
  button: {
    marginTop: "20px",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    background: "#B4552D",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
};
