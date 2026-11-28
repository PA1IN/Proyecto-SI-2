import { useState } from 'react';
import { guardarToken } from './api';

// shortcut: usa el token de prueba del backend (POST /auth/dev-token); cambiar por el login de RRHH en S3.7.
const ROLES = [
  { valor: 'JEFE_BODEGA', etiqueta: 'Jefe de bodega' },
  { valor: 'OPERADOR_BODEGA', etiqueta: 'Operador de bodega' },
  { valor: 'CONSULTA_BODEGA', etiqueta: 'Consulta' },
];

const estiloCampo = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };
const estiloEtiqueta = { display: 'block', marginBottom: '8px', fontWeight: 600 };

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [role, setRole] = useState(ROLES[0].valor);
  const [employeeId, setEmployeeId] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/dev-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, employeeId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
        throw new Error(msg || `Error ${res.status} al iniciar sesión`);
      }
      guardarToken(data.accessToken);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="pagina" style={{ maxWidth: '420px' }}>
      <h2>Iniciar sesión (prueba)</h2>
      <p>Mientras no esté el login de RRHH, elige un rol y un id de empleado.</p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="rol" style={estiloEtiqueta}>Rol</label>
          <select id="rol" value={role} onChange={(e) => setRole(e.target.value)} style={estiloCampo}>
            {ROLES.map((r) => (
              <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="empleado" style={estiloEtiqueta}>ID de empleado</label>
          <input
            id="empleado"
            type="number"
            min={1}
            required
            value={employeeId}
            onChange={(e) => setEmployeeId(Number(e.target.value))}
            style={estiloCampo}
          />
        </div>
        <button className="boton" type="submit" disabled={enviando}>
          {enviando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}
