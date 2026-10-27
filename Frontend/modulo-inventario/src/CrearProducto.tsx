import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchTemas } from './api';
import type { Tema } from './tipos';

export default function CrearProducto() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para el formulario
  const [sku, setSku] = useState('');
  const [nombreSet, setNombreSet] = useState('');
  const [idTema, setIdTema] = useState('');
  const [cantPiezas, setCantPiezas] = useState(0);

  // Temas disponibles para el selector
  const [temas, setTemas] = useState<Tema[]>([]);
  const [cargandoTemas, setCargandoTemas] = useState(true);

  useEffect(() => {
    let activo = true;

    fetchTemas()
      .then((data) => {
        if (!activo) return;
        setTemas(data);
        if (data.length > 0) setIdTema(String(data[0].id_tema));
      })
      .catch((err) => {
        if (activo) {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los temas');
        }
      })
      .finally(() => {
        if (activo) setCargandoTemas(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku,
          nombre_set: nombreSet,
          id_tema: Number(idTema),
          cant_piezas: Number(cantPiezas),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
        throw new Error(msg || 'Error al crear el producto');
      }

      const creado = (await res.json()) as { id_producto: number; nombre_set: string };

      // Volvemos a la lista mostrando el aviso y la página donde quedó el producto.
      navigate('/', {
        state: {
          mensaje: `Producto "${creado.nombre_set}" creado correctamente.`,
          idProducto: creado.id_producto,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="pagina">
      <div className="barra">
        <h2 style={{ margin: 0 }}>Ingresar Nuevo Producto</h2>
        <button className="boton boton--secundario" onClick={() => navigate('/')}>
          Volver
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #d9dee5', maxWidth: '500px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>SKU</label>
          <input 
            type="text" 
            value={sku} 
            onChange={(e) => setSku(e.target.value)} 
            maxLength={20}
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Nombre del Set</label>
          <input 
            type="text" 
            value={nombreSet} 
            onChange={(e) => setNombreSet(e.target.value)} 
            maxLength={255}
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Tema</label>
          <select
            value={idTema}
            onChange={(e) => setIdTema(e.target.value)}
            required
            disabled={cargandoTemas}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }}
          >
            {cargandoTemas && <option value="">Cargando temas…</option>}
            {!cargandoTemas && temas.length === 0 && (
              <option value="">Sin temas disponibles</option>
            )}
            {temas.map((tema) => (
              <option key={tema.id_tema} value={tema.id_tema}>
                {tema.nombre_tema}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Cantidad de Piezas</label>
          <input 
            type="number" 
            value={cantPiezas} 
            onChange={(e) => setCantPiezas(Number(e.target.value))} 
            min={0}
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <button
          type="submit"
          className="boton boton--bloque"
          disabled={cargando || cargandoTemas || temas.length === 0}
        >
          {cargando ? 'Guardando...' : 'Crear Producto'}
        </button>
      </form>
    </main>
  );
}