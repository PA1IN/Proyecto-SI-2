import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchStockPorProducto } from './api';
import type { DetalleStock } from './tipos';

export default function DetalleProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [stockDetalle, setStockDetalle] = useState<DetalleStock[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        const idNum = Number(id);
        
        // Solo cargamos el detalle de stock usando el endpoint de tu compañero
        const detalle = await fetchStockPorProducto(idNum);
        setStockDetalle(detalle);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión');
      } finally {
        setCargando(false);
      }
    };

    if (id) void cargarDatos();
  }, [id]);

  if (cargando) return <main className="pagina"><p>Cargando detalle de bodegas...</p></main>;
  if (error) return <main className="pagina"><p className="error">{error}</p></main>;

  return (
    <main className="pagina">
      <div className="barra">
        <h2 style={{ margin: 0 }}>Distribución en Bodegas (ID: {id})</h2>
        <button className="boton" onClick={() => navigate('/')} style={{ background: '#52606d' }}>
          Volver
        </button>
      </div>

      <div className="tabla-contenedor" style={{ marginTop: '24px' }}>
        <table className="tabla">
          <thead>
            <tr>
              <th>Bodega</th>
              <th>Ubicación</th>
              <th className="num">Disponible</th>
              <th className="num">Reservado</th>
              <th className="num">Mínimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {stockDetalle.length === 0 ? (
              <tr>
                <td colSpan={6} className="vacio">El producto no tiene registros físicos en ninguna bodega.</td>
              </tr>
            ) : (
              stockDetalle.map((s) => {
                const bajoMinimo = s.cantidad_disponible < s.cantidad_minima;
                return (
                  <tr key={s.id_bodega} className={bajoMinimo ? 'fila-bajo' : ''}>
                    <td>{s.bodega.nombre_bodega}</td>
                    <td>{s.bodega.ubicacion_fisica}</td>
                    <td className="num stock" style={{ fontWeight: bajoMinimo ? 700 : 400 }}>{s.cantidad_disponible}</td>
                    <td className="num">{s.cantidad_reservada}</td>
                    <td className="num">{s.cantidad_minima}</td>
                    <td style={{ fontWeight: 600, color: bajoMinimo ? '#b42318' : '#047857' }}>
                      {bajoMinimo ? 'Reabastecer' : 'OK'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}