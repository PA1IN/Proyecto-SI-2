import { useCallback, useEffect, useState } from 'react';
import { fetchProductos } from './api';
import type { Producto } from './tipos';
import { Link, useLocation } from 'react-router-dom';

const esBajoStock = (p: Producto): boolean => p.bodegas_bajo_minimo > 0;

const PRODUCTOS_POR_PAGINA = 10;


export default function Productos() {
  const location = useLocation();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizado, setActualizado] = useState<Date | null>(null);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [soloBajo, setSoloBajo] = useState(false);

  const aviso = location.state as {
    mensaje?: string;
    idProducto?: number;
  } | null;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await fetchProductos();
      setProductos(data);

      // Si venimos de crear un producto o registrar un ingreso, abrimos su página.
      const indice = aviso?.idProducto
        ? data.findIndex((p) => p.id_producto === aviso.idProducto)
        : -1;
      setPagina(indice >= 0 ? Math.floor(indice / PRODUCTOS_POR_PAGINA) + 1 : 1);

      setActualizado(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  }, [aviso]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const bajos = productos.filter(esBajoStock).length;
  const termino = busqueda.trim().toLowerCase();
  const porBusqueda = termino
    ? productos.filter((p) =>
        [p.sku, p.nombre_set, p.tema].some((valor) =>
          valor.toLowerCase().includes(termino),
        ),
      )
    : productos;
  const filtrados = soloBajo ? porBusqueda.filter(esBajoStock) : porBusqueda;
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PRODUCTOS_POR_PAGINA));
  const inicio = (pagina - 1) * PRODUCTOS_POR_PAGINA;
  const productosPagina = filtrados.slice(inicio, inicio + PRODUCTOS_POR_PAGINA);
  const fin = Math.min(inicio + PRODUCTOS_POR_PAGINA, filtrados.length);

  return (
    <>
     

      <main className="pagina">
        <div className="barra">
          <div className="barra-titulo">
            <h2>Productos</h2>
            <p className="resumen">
              {productos.length} productos
              {bajos > 0 && <span className="resumen-alerta"> · {bajos} con bajo stock</span>}
              {actualizado && (
                <span className="resumen-hora">
                  {' '}· actualizado {actualizado.toLocaleTimeString('es-CL')}
                </span>
              )}
            </p>
          </div>
          <div className="barra-acciones">
            <button
              className="boton boton--secundario"
              onClick={() => void cargar()}
              disabled={cargando}
            >
              {cargando ? 'Actualizando…' : 'Actualizar'}
            </button>
            <Link to="/productos/nuevo" className="boton">
              + Nuevo Producto
            </Link>
          </div>
        </div>

        {error && <p className="error">No se pudo cargar el inventario: {error}</p>}

        {aviso?.mensaje && (
          <p className="exito" role="status">
            {aviso.mensaje}
          </p>
        )}

        <div className="busqueda">
          <input
            type="search"
            className="input-busqueda"
            placeholder="Buscar por SKU, nombre o tema…"
            aria-label="Buscar productos"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
          />
          <label className="filtro-bajo">
            <input
              type="checkbox"
              checked={soloBajo}
              onChange={(e) => {
                setSoloBajo(e.target.checked);
                setPagina(1);
              }}
            />
            Solo bajo stock ({bajos})
          </label>
          {(termino || soloBajo) && (
            <span className="busqueda-resultado">
              {filtrados.length} de {productos.length} productos
            </span>
          )}
        </div>

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
                <th></th> {/* Nueva columna para el botón */}
              </tr>
            </thead>
            <tbody>
              {productosPagina.map((p) => (
                <tr key={p.id_producto} className={esBajoStock(p) ? 'fila-bajo' : ''}>
                  <td>{p.sku}</td>
                  <td>{p.nombre_set}</td>
                  <td>{p.tema}</td>
                  <td className="num">{p.cant_piezas.toLocaleString('es-CL')}</td>
                  <td className="num stock">{p.cantidad_disponible}</td>
                  <td className="num">{p.cantidad_reservada}</td>
                  <td className="num">{p.stock_minimo}</td>
                  <td style={{ textAlign: 'center' }}>
                    <Link to={`/productos/${p.id_producto}`} className="boton-detalle">
                      Detalle
                    </Link>
                  </td>
                </tr>
              ))}
              {!cargando && filtrados.length === 0 && !error && (
                <tr>
                  <td colSpan={8} className="vacio">
                    {productos.length === 0
                      ? 'No hay productos.'
                      : soloBajo && !termino
                        ? 'No hay productos con bajo stock.'
                        : `No se encontraron productos para “${busqueda.trim()}”.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtrados.length > 0 && (
          <div className="paginacion">
            <p className="paginacion-info">
              Mostrando {inicio + 1}–{fin} de {filtrados.length}
            </p>
            <div className="paginacion-controles">
              <button
                type="button"
                className="boton boton--secundario"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina <= 1}
              >
                Anterior
              </button>
              <span className="paginacion-pagina">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                type="button"
                className="boton boton--secundario"
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina >= totalPaginas}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}