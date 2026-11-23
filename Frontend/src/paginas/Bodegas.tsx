import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBodegas, fetchStockResumen } from '../api';
import FormBodega from '../componentes/FormBodega';
import { useRol } from '../context/useRol';
import type { Bodega, StockResumen } from '../tipos';
import { formatearNumero } from '../utilidades/formato';

type ModalBodega = { tipo: 'nueva' } | { tipo: 'editar'; bodega: Bodega } | null;

export default function Bodegas() {
  const { esJefe } = useRol();
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [stock, setStock] = useState<StockResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [modal, setModal] = useState<ModalBodega>(null);

  useEffect(() => {
    let activo = true;
    Promise.all([fetchBodegas(), fetchStockResumen()])
      .then(([bods, resumen]) => {
        if (!activo) return;
        setBodegas(bods);
        setStock(resumen);
        setError(null);
      })
      .catch((err) => {
        if (activo) setError(err instanceof Error ? err.message : 'No se pudieron cargar las bodegas');
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

  const totalDisponible = stock.reduce((total, fila) => total + fila.cantidad_disponible, 0);
  const alertas = stock.reduce((total, fila) => total + fila.bodegas_bajo_minimo, 0);

  if (cargando && bodegas.length === 0) {
    return <p className="resumen">Cargando bodegas…</p>;
  }

  return (
    <main className="pagina">
      <div className="barra">
        <div className="barra-titulo">
          <span className="page-eyebrow">Maestro</span>
          <h2>Bodegas y mínimos</h2>
          <p className="resumen">
            Maestro de bodegas y umbrales de reposición. Sin transferencias entre bodegas en el modelo.
          </p>
        </div>
        <div className="barra-acciones">
          <button className="boton boton--secundario" onClick={recargar} disabled={cargando}>
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
          {esJefe && (
            <button className="boton" onClick={() => setModal({ tipo: 'nueva' })}>
              + Nueva bodega
            </button>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="kpi-grid kpi-grid--tres">
        <div className="kpi-card">
          <b>{formatearNumero(bodegas.length)}</b>
          <span>bodegas registradas</span>
        </div>
        <div className="kpi-card">
          <b>{formatearNumero(totalDisponible)}</b>
          <span>unidades disponibles en total</span>
        </div>
        <div className={`kpi-card${alertas > 0 ? ' kpi-card--alerta' : ''}`}>
          <b>{formatearNumero(alertas)}</b>
          <span>alertas de bajo stock</span>
        </div>
      </div>

      <section className="seccion">
        <div className="seccion-cabecera">
          <div>
            <h3>Bodegas</h3>
            <p className="mini">Nombre y ubicación física que usa Logística para el picking.</p>
          </div>
        </div>

        <div className="bodega-grid">
          {bodegas.length === 0 ? (
            <div className="vacio">No hay bodegas registradas.</div>
          ) : (
            bodegas.map((bodega) => (
              <article key={bodega.id_bodega} className="bodega-card">
                <div className="bodega-card-cabecera">
                  <span className="bodega-id">#{bodega.id_bodega}</span>
                  <span className="tag tag--activo">Activa</span>
                </div>
                <h4>{bodega.nombre_bodega}</h4>
                <p className="mini">{bodega.ubicacion_fisica}</p>
                {esJefe && (
                  <button
                    type="button"
                    className="boton boton--secundario boton--mini"
                    onClick={() => setModal({ tipo: 'editar', bodega })}
                  >
                    Editar bodega
                  </button>
                )}
              </article>
            ))
          )}
        </div>
      </section>

      <section className="seccion">
        <div className="seccion-cabecera">
          <div>
            <h3>Stock por bodega y mínimos</h3>
            <p className="mini">Vista prevista para la siguiente iteración del backend.</p>
          </div>
          <Link to="/productos" className="boton boton--secundario boton--mini">
            Ver catálogo
          </Link>
        </div>

        <div className="callout callout--pendiente">
          <strong>Pendiente de backend.</strong>
          <p>
            Hoy solo existe el detalle de stock por producto (<code>GET /stock/:idProducto</code>).
            Para mostrar esta tabla por bodega y editar <code>cantidad_minima</code> se necesita:
          </p>
          <ul>
            <li><code>GET /bodegas/:id/stock</code> o <code>GET /stock?id_bodega=</code>.</li>
            <li><code>PATCH /stock/:idProducto/:idBodega</code> para cambiar el mínimo.</li>
          </ul>
          <p className="mini">
            Mientras tanto, el stock por bodega de un producto se ve en su ficha, y los mínimos son de solo lectura.
          </p>
        </div>
      </section>

      <p className="mini pie-nota">
        No hay eliminación de bodegas: las FKs del esquema usan <code>ON DELETE RESTRICT</code>.
        Las bodegas y su ubicación son la salida que consume Logística para el picking.
      </p>

      {modal?.tipo === 'nueva' && (
        <FormBodega onClose={() => setModal(null)} onSaved={recargar} />
      )}
      {modal?.tipo === 'editar' && (
        <FormBodega bodega={modal.bodega} onClose={() => setModal(null)} onSaved={recargar} />
      )}
    </main>
  );
}
