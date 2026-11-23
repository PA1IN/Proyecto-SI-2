import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchMovimientos, fetchProductos } from '../api';
import FormMovimiento from '../componentes/FormMovimiento';
import { EtiquetaEstado, EtiquetaTipo } from '../componentes/Etiqueta';
import { useRol } from '../context/useRol';
import type { Movimiento, Producto } from '../tipos';
import {
  cantidadTotalConSigno,
  fechaParaFiltro,
  formatearFecha,
  formatearNumero,
  referenciaExterna,
} from '../utilidades/formato';

const POR_PAGINA = 10;
const TIPOS = ['INGRESO', 'EGRESO', 'AJUSTE', 'RESERVA', 'LIBERACION', 'DEVOLUCION'] as const;
const ESTADOS = ['PENDIENTE', 'COMPLETADO', 'ANULADO'] as const;

export default function Movimientos() {
  const { puedeIngresar, puedeAjustar, puedeVerHistorial } = useRol();
  const [searchParams, setSearchParams] = useSearchParams();

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [texto, setTexto] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [productoFiltro, setProductoFiltro] = useState(searchParams.get('producto') ?? '');
  const [pagina, setPagina] = useState(1);
  const [modal, setModal] = useState<'ingreso' | 'ajuste' | null>(
    searchParams.get('accion') === 'ingreso' ? 'ingreso' : null,
  );

  const seleccionadoId = Number(searchParams.get('mov')) || null;

  useEffect(() => {
    let activo = true;
    Promise.all([fetchMovimientos(), fetchProductos()])
      .then(([movs, prods]) => {
        if (!activo) return;
        setMovimientos(movs);
        setProductos(prods);
        setError(null);
      })
      .catch((err) => {
        if (activo) setError(err instanceof Error ? err.message : 'No se pudo cargar el historial');
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

  const termino = texto.trim().toLowerCase();
  const filtrados = movimientos.filter((m) => {
    if (tipo && m.tipo_operacion !== tipo) return false;
    if (estado && m.estado !== estado) return false;
    if (productoFiltro && !m.detalles.some((d) => d.id_producto === Number(productoFiltro))) {
      return false;
    }

    const fecha = fechaParaFiltro(m.fecha_registro);
    if (desde && fecha < desde) return false;
    if (hasta && fecha > hasta) return false;

    if (!termino) return true;
    const textoMovimiento = [
      String(m.id_movimiento),
      String(m.id_empleado),
      m.id_pedido != null ? String(m.id_pedido) : '',
      m.id_devolucion != null ? String(m.id_devolucion) : '',
      ...m.detalles.flatMap((d) => [
        d.producto.nombre_set,
        d.producto.sku,
        d.bodega.nombre_bodega,
      ]),
    ]
      .join(' ')
      .toLowerCase();
    return textoMovimiento.includes(termino);
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const visibles = filtrados.slice(inicio, inicio + POR_PAGINA);
  const seleccionado = movimientos.find((m) => m.id_movimiento === seleccionadoId) ?? null;

  const abrirDetalle = (id: number) => {
    const siguiente = new URLSearchParams(searchParams);
    siguiente.set('mov', String(id));
    setSearchParams(siguiente);
  };

  const cerrarDetalle = () => {
    const siguiente = new URLSearchParams(searchParams);
    siguiente.delete('mov');
    setSearchParams(siguiente);
  };

  const limpiarFiltros = () => {
    setTipo('');
    setEstado('');
    setTexto('');
    setDesde('');
    setHasta('');
    setProductoFiltro('');
    setPagina(1);
    const siguiente = new URLSearchParams(searchParams);
    siguiente.delete('producto');
    setSearchParams(siguiente);
  };

  const reiniciarPagina = () => setPagina(1);

  if (cargando && movimientos.length === 0) {
    return <p className="resumen">Cargando movimientos…</p>;
  }

  return (
    <main className="pagina">
      <div className="barra">
        <div className="barra-titulo">
          <span className="page-eyebrow">Operación</span>
          <h2>Movimientos</h2>
          <p className="resumen">
            Consulta y registra los movimientos de stock.
          </p>
        </div>
        <div className="barra-acciones">
          {puedeIngresar && (
            <button className="boton" onClick={() => setModal('ingreso')}>
              + Registrar ingreso
            </button>
          )}
          {puedeAjustar && (
            <button className="boton boton--secundario" onClick={() => setModal('ajuste')}>
              Registrar ajuste
            </button>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {!puedeVerHistorial ? (
        <div className="lock">
          <strong>Historial restringido.</strong>
          <p>No tienes permiso para ver el historial de movimientos.</p>
        </div>
      ) : (
        <>
          <div className="filtros-panel">
            <select
              className="filtro-select"
              value={tipo}
              onChange={(e) => { setTipo(e.target.value); reiniciarPagina(); }}
              aria-label="Filtrar por tipo"
            >
              <option value="">Todos los tipos</option>
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            <select
              className="filtro-select"
              value={estado}
              onChange={(e) => { setEstado(e.target.value); reiniciarPagina(); }}
              aria-label="Filtrar por estado"
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>

            <select
              className="filtro-select"
              value={productoFiltro}
              onChange={(e) => { setProductoFiltro(e.target.value); reiniciarPagina(); }}
              aria-label="Filtrar por producto"
            >
              <option value="">Todos los productos</option>
              {productos.map((p) => (
                <option key={p.id_producto} value={p.id_producto}>
                  {p.sku} · {p.nombre_set}
                </option>
              ))}
            </select>

            <div className="buscador-pill buscador-pill--filtro">
              <svg
                className="buscador-icono"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                className="input-busqueda"
                placeholder="Buscar producto o pedido…"
                aria-label="Buscar movimientos"
                value={texto}
                onChange={(e) => { setTexto(e.target.value); reiniciarPagina(); }}
              />
            </div>

            <input
              className="filtro-select"
              type="date"
              value={desde}
              onChange={(e) => { setDesde(e.target.value); reiniciarPagina(); }}
              aria-label="Desde"
            />
            <input
              className="filtro-select"
              type="date"
              value={hasta}
              onChange={(e) => { setHasta(e.target.value); reiniciarPagina(); }}
              aria-label="Hasta"
            />
            <button type="button" className="boton boton--secundario boton--mini" onClick={limpiarFiltros}>
              Limpiar
            </button>
          </div>

          <div className="tabla-contenedor">
            <table className="tabla tabla--movimientos">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Producto(s)</th>
                  <th>Bodega(s)</th>
                  <th className="num">Cant.</th>
                  <th>Referencia externa</th>
                  <th className="num">Empleado</th>
                </tr>
              </thead>
              <tbody>
                {visibles.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="vacio">Sin resultados con estos filtros.</td>
                  </tr>
                ) : (
                  visibles.map((m) => {
                    const primera = m.detalles[0];
                    const productosTexto = primera
                      ? `${primera.producto.nombre_set}${m.detalles.length > 1 ? ` +${m.detalles.length - 1}` : ''}`
                      : 'Sin líneas';
                    const bodegasTexto = primera
                      ? `${primera.bodega.nombre_bodega}${m.detalles.length > 1 ? ' +' : ''}`
                      : '—';
                    return (
                      <tr
                        key={m.id_movimiento}
                        className="fila-click"
                        tabIndex={0}
                        onClick={() => abrirDetalle(m.id_movimiento)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            abrirDetalle(m.id_movimiento);
                          }
                        }}
                      >
                        <td>{m.id_movimiento}</td>
                        <td>{formatearFecha(m.fecha_registro)}</td>
                        <td><EtiquetaTipo tipo={m.tipo_operacion} /></td>
                        <td><EtiquetaEstado estado={m.estado} /></td>
                        <td>{productosTexto}</td>
                        <td>{bodegasTexto}</td>
                        <td className="num">{cantidadTotalConSigno(m)}</td>
                        <td>{referenciaExterna(m)}</td>
                        <td className="num">#{m.id_empleado}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="paginacion">
            <p className="paginacion-info">
              Mostrando {filtrados.length === 0 ? 0 : inicio + 1}–{Math.min(inicio + POR_PAGINA, filtrados.length)} de {filtrados.length}
            </p>
            <div className="paginacion-controles">
              <button
                type="button"
                className="boton boton--secundario"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaActual <= 1}
              >
                Anterior
              </button>
              <span className="paginacion-pagina">Página {paginaActual} de {totalPaginas}</span>
              <button
                type="button"
                className="boton boton--secundario"
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual >= totalPaginas}
              >
                Siguiente
              </button>
            </div>
          </div>

          {seleccionado && (
            <section className="detalle-movimiento">
              <div className="seccion-cabecera">
                <div>
                  <h3>Movimiento #{seleccionado.id_movimiento}</h3>
                  <p className="mini">
                    {formatearFecha(seleccionado.fecha_registro)} · registrado por empleado #
                    {seleccionado.id_empleado} · {referenciaExterna(seleccionado)}
                  </p>
                </div>
                <button type="button" className="boton boton--secundario boton--mini" onClick={cerrarDetalle}>
                  Cerrar detalle
                </button>
              </div>

              <div className="detalle-movimiento-meta">
                <EtiquetaTipo tipo={seleccionado.tipo_operacion} />
                <EtiquetaEstado estado={seleccionado.estado} />
                {seleccionado.id_pedido != null && <span className="detalle-chip">Pedido #{seleccionado.id_pedido}</span>}
                {seleccionado.id_devolucion != null && <span className="detalle-chip">Devolución #{seleccionado.id_devolucion}</span>}
              </div>

              <div className="tabla-contenedor">
                <table className="tabla tabla--compacta">
                  <thead>
                    <tr>
                      <th>Línea</th>
                      <th>Producto</th>
                      <th>Bodega</th>
                      <th className="num">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seleccionado.detalles.map((detalle, indice) => (
                      <tr key={detalle.id_detalle}>
                        <td>{indice + 1}</td>
                        <td>
                          <Link to={`/productos/${detalle.id_producto}`} className="enlace-tabla">
                            {detalle.producto.nombre_set}
                          </Link>
                          <div className="mini">{detalle.producto.sku}</div>
                        </td>
                        <td>{detalle.bodega.nombre_bodega}</td>
                        <td className="num">{formatearNumero(detalle.cantidad)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {modal === 'ingreso' && (
        <FormMovimiento tipo="INGRESO" onClose={() => setModal(null)} onSaved={recargar} />
      )}
      {modal === 'ajuste' && (
        <FormMovimiento tipo="AJUSTE" onClose={() => setModal(null)} onSaved={recargar} />
      )}
    </main>
  );
}
