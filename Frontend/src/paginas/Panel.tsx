import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBodegas, fetchCatalogoConStock, fetchMovimientos } from '../api';
import FormMovimiento from '../componentes/FormMovimiento';
import FormProducto from '../componentes/FormProducto';
import { EtiquetaEstado, EtiquetaTipo } from '../componentes/Etiqueta';
import { useRol } from '../context/useRol';
import type { Bodega, Movimiento, ProductoConStock } from '../tipos';
import { cantidadTotal, formatearFecha, formatearNumero, resumenLineas } from '../utilidades/formato';

export default function Panel() {
  const { esJefe, puedeIngresar } = useRol();

  const [productos, setProductos] = useState<ProductoConStock[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [bodegaFiltro, setBodegaFiltro] = useState('');
  const [modal, setModal] = useState<'ingreso' | 'producto' | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.all([fetchCatalogoConStock(), fetchMovimientos(), fetchBodegas()])
      .then(([catalogo, movs, bods]) => {
        if (!activo) return;
        setProductos(catalogo);
        setMovimientos(movs);
        setBodegas(bods);
        setError(null);
      })
      .catch((err) => {
        if (activo) setError(err instanceof Error ? err.message : 'No se pudo cargar el panel');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [version]);

  const recargar = () => {
    setCargando(true);
    setVersion((v) => v + 1);
  };

  const totalDisponible = productos.reduce((total, p) => total + p.cantidad_disponible, 0);
  const totalReservado = productos.reduce((total, p) => total + p.cantidad_reservada, 0);
  const alertas = productos.reduce((total, p) => total + p.bodegas_bajo_minimo, 0);
  const productosBajo = productos
    .filter((p) => p.bodegas_bajo_minimo > 0)
    .sort((a, b) => b.bodegas_bajo_minimo - a.bodegas_bajo_minimo || a.cantidad_disponible - b.cantidad_disponible);

  const reservasPendientes = movimientos
    .filter((m) => m.tipo_operacion === 'RESERVA' && m.estado === 'PENDIENTE')
    .flatMap((movimiento) =>
      movimiento.detalles.map((detalle) => ({ movimiento, detalle })),
    )
    .filter(({ detalle }) => !bodegaFiltro || detalle.id_bodega === Number(bodegaFiltro));

  const ultimos = movimientos.slice(0, 5);

  if (cargando && productos.length === 0) {
    return <p className="resumen">Cargando panel de inventario…</p>;
  }

  return (
    <main className="pagina">
      <div className="barra">
        <div className="barra-titulo">
          <span className="page-eyebrow">Panel</span>
          <h2>Stock y alertas</h2>
          <p className="resumen">Qué hay, qué está comprometido y qué hay que reponer.</p>
        </div>
        <div className="barra-acciones">
          {puedeIngresar && (
            <button className="boton" onClick={() => setModal('ingreso')}>
              + Registrar ingreso
            </button>
          )}
          {esJefe && (
            <button className="boton boton--secundario" onClick={() => setModal('producto')}>
              Nuevo producto
            </button>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="kpi-grid">
        <div className="kpi-card">
          <b>{formatearNumero(totalDisponible)}</b>
          <span>unidades disponibles</span>
        </div>
        <div className="kpi-card">
          <b>{formatearNumero(totalReservado)}</b>
          <span>unidades reservadas</span>
        </div>
        <div className="kpi-card">
          <b>{formatearNumero(productos.length)}</b>
          <span>productos activos</span>
        </div>
        <div className={`kpi-card${alertas > 0 ? ' kpi-card--alerta' : ''}`}>
          <b>{formatearNumero(alertas)}</b>
          <span>alertas de bajo stock</span>
        </div>
      </div>

      <section className="seccion">
        <div className="seccion-cabecera">
          <div>
            <h3>Requiere reposición</h3>
            <p className="mini">Productos con al menos una bodega bajo su mínimo.</p>
          </div>
          <Link to="/productos?bajo=1" className="boton boton--secundario boton--mini">
            Ver catálogo
          </Link>
        </div>

        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th className="num">Bodegas bajo mínimo</th>
                <th className="num">Disponible total</th>
                <th className="num">Mínimo total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {productosBajo.length === 0 ? (
                <tr>
                  <td colSpan={6} className="vacio">Todo el stock está sobre el mínimo configurado.</td>
                </tr>
              ) : (
                productosBajo.slice(0, 12).map((p) => (
                  <tr key={p.id_producto}>
                    <td>
                      <Link to={`/productos/${p.id_producto}`} className="enlace-tabla">
                        {p.nombre_set}
                      </Link>
                    </td>
                    <td>{p.sku}</td>
                    <td className="num">
                      <span className="tag tag--alerta">{p.bodegas_bajo_minimo}</span>
                    </td>
                    <td className="num">{formatearNumero(p.cantidad_disponible)}</td>
                    <td className="num">{formatearNumero(p.cantidad_minima)}</td>
                    <td><span className="tag tag--alerta">Reponer</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {productosBajo.length > 12 && (
          <p className="mini">Mostrando 12 de {productosBajo.length} alertas.</p>
        )}
      </section>

      <div className="grid-2">
        <section className="seccion">
          <div className="seccion-cabecera">
            <div>
              <h3>Stock comprometido</h3>
              <p className="mini">Pedidos con stock comprometido.</p>
            </div>
            <select
              className="filtro-select"
              value={bodegaFiltro}
              onChange={(e) => setBodegaFiltro(e.target.value)}
              aria-label="Filtrar reservas por bodega"
            >
              <option value="">Todas las bodegas</option>
              {bodegas.map((b) => (
                <option key={b.id_bodega} value={b.id_bodega}>{b.nombre_bodega}</option>
              ))}
            </select>
          </div>

          <div className="tabla-contenedor">
            <table className="tabla tabla--compacta">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Producto</th>
                  <th>Bodega</th>
                  <th className="num">Uds.</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {reservasPendientes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="vacio">Sin reservas pendientes.</td>
                  </tr>
                ) : (
                  reservasPendientes.map(({ movimiento, detalle }) => (
                    <tr key={`${movimiento.id_movimiento}-${detalle.id_detalle}`}>
                      <td>#{movimiento.id_pedido ?? '—'}</td>
                      <td>
                        <Link to={`/productos/${detalle.id_producto}`} className="enlace-tabla">
                          {detalle.producto.nombre_set}
                        </Link>
                      </td>
                      <td>{detalle.bodega.nombre_bodega}</td>
                      <td className="num">{formatearNumero(detalle.cantidad)}</td>
                      <td><EtiquetaEstado estado={movimiento.estado} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="seccion">
          <div className="seccion-cabecera">
            <div>
              <h3>Últimos movimientos</h3>
              <p className="mini">Trazabilidad reciente de ingresos, reservas y ajustes.</p>
            </div>
            <Link to="/movimientos" className="boton boton--secundario boton--mini">
              Ver todos
            </Link>
          </div>

          <div className="tabla-contenedor">
            <table className="tabla tabla--compacta">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Producto</th>
                  <th className="num">Cant.</th>
                </tr>
              </thead>
              <tbody>
                {ultimos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="vacio">Todavía no hay movimientos registrados.</td>
                  </tr>
                ) : (
                  ultimos.map((m) => (
                    <tr key={m.id_movimiento}>
                      <td>
                        <Link to={`/movimientos?mov=${m.id_movimiento}`} className="enlace-tabla">
                          {m.id_movimiento}
                        </Link>
                      </td>
                      <td>{formatearFecha(m.fecha_registro)}</td>
                      <td><EtiquetaTipo tipo={m.tipo_operacion} /></td>
                      <td>{resumenLineas(m)}</td>
                      <td className="num">{formatearNumero(cantidadTotal(m))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modal === 'ingreso' && (
        <FormMovimiento tipo="INGRESO" onClose={() => setModal(null)} onSaved={recargar} />
      )}
      {modal === 'producto' && (
        <FormProducto onClose={() => setModal(null)} onSaved={recargar} />
      )}
    </main>
  );
}
