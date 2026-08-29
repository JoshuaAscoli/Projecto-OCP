import RegistroForm from './formulario';
import VerificarCuenta from './VerificarCuenta';

export default function App() {
  const esVerificacion = window.location.pathname === '/verificar';

  return esVerificacion ? <VerificarCuenta /> : <RegistroForm />;
}