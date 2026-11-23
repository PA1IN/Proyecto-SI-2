import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchMovimientos, fetchProducto, fetchStockProducto } from '../api';
import FormMovimiento from '../componentes/FormMovimiento';
import FormProducto from '../componentes/FormProducto';
import Miniatura from '../componentes/Miniatura';
import { EtiquetaEstado, EtiquetaTipo } from '../componentes/Etiqueta';
import { useRol } from '../context/useRol';
import type { Movimiento, ProductoConStock, StockBodega } from '../tipos';
import { formatearFecha, formatearNumero } from '../utilidades/formato';

type ModalFicha = 'ingreso' | 'ajuste' | 'editar' | null;

function cantidadConSigno(movimiento: Movimiento, cantidad: number): string {
  if (movimiento.tipo_operacion === 'AJUSTE') {
    return cantidad > 0 ? `+${cantidad}` : String(cantidad);
  }
  if (movimiento.tipo_operacion === 'INGRESO' || movimiento.tipo_operacion === 'LIBERACION' || movimiento.tipo_operacion === 'DEVOLUCION') {
    return `+${cantidad}`;
  }
  return `-${cantidad}`;
}

export default function FichaProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { esJefe, puedeIngresar, puedeAjustar } = useRol();
  const idProducto = Number(id);

  const [producto, setProducto] = useState<ProductoConStock | null>(null);
  const [stock, setStock] = useState<StockBodega[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [modal, setModal] = useState<ModalFicha>(null);

  useEffect(() => {
    let activo = true;
    Promise.all([fetchProducto(idProducto), fetchStockProducto(idProducto), fetchMovimientos()])
      .then(([prod, stockProd, movs]) => {
        if (!activo) return;
        setProducto(prod);
        setStock(stockProd);
        setMovimientos(movs);
        setError(null);
      })
      .catch((err) => {
        if (activo) setError(err instanceof Error ? err.message : 'No se pudo cargar el producto');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [idProducto, version]);

  const recargar = () => {
    setCargando(true);
    setVersion((v) => v + 1);
  };

  const movimientosProducto = movimientos.filter((m) =>
    m.detalles.some((d) => d.id_producto === idProducto),
  );
  const reservas = movimientosProducto
    .filter((m) => m.tipo_operacion === 'RESERVA' && m.estado === 'PENDIENTE')
    .flatMap((movimiento) =>
      movimiento.detalles
        .filter((d) => d.id_producto === idProducto)
        .map((detalle) => ({ movimiento, detalle })),
    );
  const historial = movimientosProducto.slice(0, 12);

  const totalReservado = stock.reduce((total, fila) => total + fila.cantidad_reservada, 0);
  const totalMinimo = stock.reduce((total, fila) => total + fila.cantidad_minima, 0);
  const totalDisponible = producto?.cantidad_disponible ?? 0;

  if (cargando && !producto) {
    return <p className="resumen">Cargando ficha del producto…</p>;
  }

  if (error || !producto) {
    return (
      <main className="pagina">
        <div className="lock">
          <strong>No se pudo abrir el producto.</strong>
          <p>{error ?? `El producto ${idProducto} no existe (404).`}</p>
          <button className="boton boton--secundario" onClick={() => navigate('/productos')}>
            Volver al catálogo
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="pagina">
      <div className="migas">
        <Link to="/productos">Catálogo</Link>
        <span>/</span>
        <span>{producto.sku}</span>
      </div>

      <div className="ficha-hero">
        <div className="ficha-media">
          <Miniatura producto={producto} grande />
        </div>

        <div className="ficha-info">
          <div className="ficha-etiquetas">
            <span className="page-eyebrow">{producto.tema.nombre_tema}</span>
            <span className={`tag ${producto.activo ? 'tag--activo' : 'tag--inactivo'}`}>
              {producto.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          <h2>{producto.nombre_set}</h2>
          <p className="ficha-meta">
            SKU {producto.sku} · {formatearNumero(producto.cant_piezas)} piezas
          </p>

          <p className="ficha-meta">
            {producto.peso_unitario_kg != null ? `${producto.peso_unitario_kg} kg` : 'Peso sin dato'}
            {' · '}
            {producto.largo_cm != null && producto.alto_cm != null && producto.ancho_cm != null
              ? `${producto.largo_cm} × ${producto.alto_cm} × ${producto.ancho_cm} cm`
              : 'Medidas sin dato'}
          </p>

          <div className="ficha-acciones">
            {puedeIngresar && (
              <button className="boton" onClick={() => setModal('ingreso')}>
                Registrar ingreso
              </button>
            )}
            {puedeAjustar && (
              <button className="boton boton--secundario" onClick={() => setModal('ajuste')}>
                Ajustar stock
              </button>
            )}
            {esJefe && (
              <button className="boton boton--secundario" onClick={() => setModal('editar')}>
                Editar datos
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="kpi-grid kpi-grid--tres">
        <div className="kpi-card">
          <b>{formatearNumero(totalDisponible)}</b>
          <span>disponibles</span>
        </div>
        <div className="kpi-card">
          <b>{formatearNumero(totalReservado)}</b>
          <span>reservadas</span>
        </div>
        <div className="kpi-card">
          <b>{formatearNumero(totalMinimo)}</b>
          <span>mínimo total</span>
        </div>
      </div>

      <section className="seccion">
        <div className="seccion-cabecera">
          <div>
            <h3>Stock por bodega y ubicación</h3>
            <p className="mini">Ubicación física registrada por bodega.</p>
          </div>
        </div>

        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Bodega</th>
                <th>Ubicación física</th>
                <th className="num">Disponible</th>
                <th className="num">Reservado</th>
                <th className="num">Mínimo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {stock.length === 0 ? (
                <tr>
                  <td colSpan={6} className="vacio">
                    El producto existe pero aún no tiene stock en ninguna bodega.
                  </td>
                </tr>
              ) : (
                stock.map((fila) => {
                  const bajo = fila.cantidad_disponible < fila.cantidad_minima;
                  return (
                    <tr key={fila.id_bodega} className={bajo ? 'fila-bajo' : ''}>
                      <td>{fila.bodega.nombre_bodega}</td>
                      <td>{fila.bodega.ubicacion_fisica}</td>
                      <td className={`num stock${bajo ? ' stock--bajo' : ''}`}>
                        {formatearNumero(fila.cantidad_disponible)}
                      </td>
                      <td className="num">{formatearNumero(fila.cantidad_reservada)}</td>
                      <td className="num">{formatearNumero(fila.cantidad_minima)}</td>
                      <td className={bajo ? 'estado-bajo' : 'estado-ok'}>
                        {bajo ? 'Reabastecer' : 'OK'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid-2">
        <section className="seccion">
          <div className="seccion-cabecera">
            <div>
              <h3>Reservas por pedido</h3>
              <p className="mini">Unidades comprometidas por pedido.</p>
            </div>
          </div>
          <div className="tabla-contenedor">
            <table className="tabla tabla--compacta">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Bodega</th>
                  <th className="num">Uds.</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {reservas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="vacio">Sin reservas pendientes para este producto.</td>
                  </tr>
                ) : (
                  reservas.map(({ movimiento, detalle }) => (
                    <tr key={`${movimiento.id_movimiento}-${detalle.id_detalle}`}>
                      <td>#{movimiento.id_pedido ?? '—'}</td>
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
              <h3>Historial del producto</h3>
              <p className="mini">Movimientos recientes del producto.</p>
            </div>
            <Link to={`/movimientos?producto=${producto.id_producto}`} className="boton boton--secundario boton--mini">
              Ver historial
            </Link>
          </div>
          <div className="tabla-contenedor">
            <table className="tabla tabla--compacta">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tipo</th>
                  <th className="num">Cant.</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {historial.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="vacio">Sin movimientos para este producto.</td>
                  </tr>
                ) : (
                  historial.map((movimiento) => {
                    const detalle = movimiento.detalles.find((d) => d.id_producto === idProducto);
                    return (
                      <tr key={movimiento.id_movimiento}>
                        <td>
                          <Link to={`/movimientos?mov=${movimiento.id_movimiento}`} className="enlace-tabla">
                            {movimiento.id_movimiento}
                          </Link>
                        </td>
                        <td><EtiquetaTipo tipo={movimiento.tipo_operacion} /></td>
                        <td className="num">
                          {detalle ? cantidadConSigno(movimiento, detalle.cantidad) : '—'}
                        </td>
                        <td>{formatearFecha(movimiento.fecha_registro)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modal === 'ingreso' && (
        <FormMovimiento
          tipo="INGRESO"
          productoId={producto.id_producto}
          onClose={() => setModal(null)}
          onSaved={recargar}
        />
      )}
      {modal === 'ajuste' && (
        <FormMovimiento
          tipo="AJUSTE"
          productoId={producto.id_producto}
          onClose={() => setModal(null)}
          onSaved={recargar}
        />
      )}
      {modal === 'editar' && (
        <FormProducto
          producto={producto}
          onClose={() => setModal(null)}
          onSaved={recargar}
        />
      )}
    </main>
  );
}
