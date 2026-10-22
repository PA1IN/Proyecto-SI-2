import { useCallback, useEffect, useState } from 'react';
import { fetchProductos } from './api';
import type { Producto } from './tipos';

const STOCK_MINIMO_POR_DEFECTO = 5;

const minimoDe = (p: Producto): number => p.stock_minimo ?? STOCK_MINIMO_POR_DEFECTO;
const esBajoStock = (p: Producto): boolean => p.cantidad_disponible <= minimoDe(p);

export default function App() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizado, setActualizado] = useState<Date | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setProductos(await fetchProductos());
      setActualizado(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const bajos = productos.filter(esBajoStock).length;

  return (
    <>
      <header className="banner">
        <h1>Inventario Lesgo</h1>
      </header>

      <main className="pagina">
        <div className="barra">
          <p className="resumen">
            {productos.length} productos
            {bajos > 0 && <span className="resumen-alerta"> · {bajos} con bajo stock</span>}
            {actualizado && (
              <span className="resumen-hora">
                {' '}· actualizado {actualizado.toLocaleTimeString('es-CL')}
              </span>
            )}
          </p>
          <button className="boton" onClick={() => void cargar()} disabled={cargando}>
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>

        {error && <p className="error">No se pudo cargar el inventario: {error}</p>}

        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nombre</th>
                <th>Tema</th>
                <th className="num">Piezas</th>
                <th className="num">Disponible</th>
                <th className="num">Reservado</th>
                <th className="num">Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id_producto} className={esBajoStock(p) ? 'fila-bajo' : ''}>
                  <td>{p.sku}</td>
                  <td>{p.nombre_set}</td>
                  <td>{p.tema}</td>
                  <td className="num">{p.cant_piezas.toLocaleString('es-CL')}</td>
                  <td className="num stock">{p.cantidad_disponible}</td>
                  <td className="num">{p.cantidad_reservada}</td>
                  <td className="num">{minimoDe(p)}</td>
                </tr>
              ))}
              {!cargando && productos.length === 0 && !error && (
                <tr>
                  <td colSpan={7} className="vacio">No hay productos.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}