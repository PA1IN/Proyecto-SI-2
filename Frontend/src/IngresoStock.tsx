import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProductos, fetchBodegas } from './api';
import type { Producto, Bodega } from './tipos';

export default function IngresoStock() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del formulario
  const [idProducto, setIdProducto] = useState('');
  const [idBodega, setIdBodega] = useState('');
  const [cantidad, setCantidad] = useState(1);
  // Nuevo estado para el empleado
  const [idEmpleado, setIdEmpleado] = useState(1);

  useEffect(() => {
    Promise.all([fetchProductos(), fetchBodegas()])
      .then(([prods, bods]) => {
        setProductos(prods);
        setBodegas(bods);
      })
      .catch(() => setError('Error al cargar la lista de productos y bodegas'))
      .finally(() => setCargandoDatos(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/movimientos/ingreso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_producto: Number(idProducto),
          id_bodega: Number(idBodega),
          cantidad: Number(cantidad),
          // Agregamos el parámetro faltante que pide el backend
          id_empleado: Number(idEmpleado),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
        throw new Error(msg || 'Error al registrar el ingreso de stock');
      }

      navigate('/', {
        state: {
          mensaje: 'Ingreso de stock registrado correctamente.',
          idProducto: Number(idProducto),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="pagina">
      <div className="barra">
        <h2 style={{ margin: 0 }}>Registrar Ingreso de Stock</h2>
        <button className="boton boton--secundario" onClick={() => navigate('/')}>
          Volver
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {cargandoDatos ? (
        <p>Cargando información del sistema...</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #d9dee5', maxWidth: '500px' }}>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Producto</label>
            <select 
              value={idProducto} 
              onChange={(e) => setIdProducto(e.target.value)} 
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="" disabled>Seleccione un producto...</option>
              {productos.map(p => (
                <option key={p.id_producto} value={p.id_producto}>
                  {p.sku} - {p.nombre_set}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Bodega Destino</label>
            <select 
              value={idBodega} 
              onChange={(e) => setIdBodega(e.target.value)} 
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="" disabled>Seleccione una bodega...</option>
              {bodegas.map(b => (
                <option key={b.id_bodega} value={b.id_bodega}>
                  {b.nombre_bodega}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>ID Empleado (Operario)</label>
            <input 
              type="number" 
              value={idEmpleado} 
              onChange={(e) => setIdEmpleado(Number(e.target.value))} 
              min={1}
              required 
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Cantidad a Ingresar</label>
            <input 
              type="number" 
              value={cantidad} 
              onChange={(e) => setCantidad(Number(e.target.value))} 
              min={1}
              required 
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <button type="submit" className="boton boton--bloque" disabled={guardando}>
            {guardando ? 'Registrando...' : 'Confirmar Ingreso'}
          </button>
        </form>
      )}
    </main>
  );
}