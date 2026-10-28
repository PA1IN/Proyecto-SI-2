import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProductos, fetchStockPorProducto } from './api';
import type { DetalleStock, Producto } from './tipos';

export default function DetalleProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [producto, setProducto] = useState<Producto | null>(null);
  const [stockDetalle, setStockDetalle] = useState<DetalleStock[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        const idNum = Number(id);
        
        const [detalle, productos] = await Promise.all([
          fetchStockPorProducto(idNum),
          fetchProductos(),
        ]);

        setStockDetalle(detalle);
        setProducto(productos.find((p) => p.id_producto === idNum) ?? null);
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
        <div className="barra-titulo">
          <h2 style={{ margin: 0 }}>
            {producto ? producto.nombre_set : `Distribución en Bodegas (ID: ${id})`}
          </h2>
          {producto && (
            <p className="resumen">
              SKU {producto.sku} · Tema {producto.tema}
            </p>
          )}
        </div>
        <button className="boton boton--secundario" onClick={() => navigate('/')}>
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
                    <td style={{ fontWeight: 600, color: bajoMinimo ? '#b42318' : '#61707f' }}>
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