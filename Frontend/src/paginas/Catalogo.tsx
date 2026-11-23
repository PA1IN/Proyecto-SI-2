import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchCatalogoConStock, fetchTemas } from '../api';
import FormProducto from '../componentes/FormProducto';
import Miniatura from '../componentes/Miniatura';
import { useRol } from '../context/useRol';
import { useToast } from '../context/useToast';
import type { ProductoConStock, Tema } from '../tipos';
import { formatearNumero } from '../utilidades/formato';

const POR_PAGINA = 10;

type ModalProducto = { tipo: 'nuevo' } | { tipo: 'editar'; producto: ProductoConStock } | null;

export default function Catalogo() {
  const { esJefe } = useRol();
  const mostrarToast = useToast();
  const [searchParams] = useSearchParams();

  const [productos, setProductos] = useState<ProductoConStock[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const [busqueda, setBusqueda] = useState('');
  const [temaFiltro, setTemaFiltro] = useState('');
  const [soloBajo, setSoloBajo] = useState(searchParams.get('bajo') === '1');
  const [pagina, setPagina] = useState(1);
  const [modal, setModal] = useState<ModalProducto>(null);

  useEffect(() => {
    let activo = true;
    Promise.all([fetchCatalogoConStock(), fetchTemas()])
      .then(([catalogo, temasApi]) => {
        if (!activo) return;
        setProductos(catalogo);
        setTemas(temasApi);
        setError(null);
      })
      .catch((err) => {
        if (activo) setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo');
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

  const termino = busqueda.trim().toLowerCase();
  let filtrados = productos.filter((p) => {
    const coincideTexto =
      !termino ||
      [p.sku, p.nombre_set, p.tema.nombre_tema].some((valor) =>
        valor.toLowerCase().includes(termino),
      );
    const coincideTema = !temaFiltro || p.tema.nombre_tema === temaFiltro;
    const coincideBajo = !soloBajo || p.bodegas_bajo_minimo > 0;
    return coincideTexto && coincideTema && coincideBajo;
  });

  filtrados = filtrados.sort((a, b) => a.nombre_set.localeCompare(b.nombre_set, 'es'));

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const visibles = filtrados.slice(inicio, inicio + POR_PAGINA);

  const copiarSku = async (sku: string) => {
    try {
      await navigator.clipboard.writeText(sku);
      mostrarToast(`SKU copiado: ${sku}`);
    } catch {
      mostrarToast('No se pudo copiar el SKU.');
    }
  };

  if (cargando && productos.length === 0) {
    return <p className="resumen">Cargando catálogo…</p>;
  }

  return (
    <main className="pagina">
      <div className="barra">
        <div className="barra-titulo">
          <span className="page-eyebrow">Catálogo</span>
          <h2>Productos</h2>
          <p className="resumen">
            Administra el catálogo de sets y consulta su disponibilidad.
          </p>
        </div>
        <div className="barra-acciones">
          <button className="boton boton--secundario" onClick={recargar} disabled={cargando}>
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
          {esJefe && (
            <button className="boton" onClick={() => setModal({ tipo: 'nuevo' })}>
              + Nuevo producto
            </button>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="busqueda">
        <div className="buscador-pill">
          <svg
            className="buscador-icono"
            width="18"
            height="18"
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
            placeholder="Buscar por SKU, nombre o tema…"
            aria-label="Buscar productos"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
          />
        </div>

        <select
          className="filtro-select"
          value={temaFiltro}
          onChange={(e) => {
            setTemaFiltro(e.target.value);
            setPagina(1);
          }}
          aria-label="Filtrar por tema"
        >
          <option value="">Todos los temas</option>
          {temas.map((tema) => (
            <option key={tema.id_tema} value={tema.nombre_tema}>{tema.nombre_tema}</option>
          ))}
        </select>

        <label className="filtro-bajo">
          <input
            type="checkbox"
            checked={soloBajo}
            onChange={(e) => {
              setSoloBajo(e.target.checked);
              setPagina(1);
            }}
          />
          Solo bajo stock
        </label>

        {(termino || temaFiltro || soloBajo) && (
          <span className="busqueda-resultado">
            {filtrados.length} de {productos.length} productos
          </span>
        )}
      </div>

      <div className="tabla-contenedor">
        <table className="tabla tabla--catalogo">
          <thead>
            <tr>
              <th aria-label="Imagen"></th>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Tema</th>
              <th className="num">Piezas</th>
              <th className="num">Disponible</th>
              <th className="num">Reservado</th>
              <th className="num">Mínimo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr>
                <td colSpan={9} className="vacio">
                  Ningún producto coincide. Prueba quitando un filtro.
                </td>
              </tr>
            ) : (
              visibles.map((p) => {
                const bajo = p.bodegas_bajo_minimo > 0;
                return (
                  <tr key={p.id_producto} className={bajo ? 'fila-bajo' : ''}>
                    <td className="celda-miniatura"><Miniatura producto={p} /></td>
                    <td>
                      <div className="sku-celda">
                        <span>{p.sku}</span>
                        <button
                          type="button"
                          className="boton-copiar"
                          onClick={() => void copiarSku(p.sku)}
                          title="Copiar SKU"
                        >
                          Copiar
                        </button>
                      </div>
                    </td>
                    <td>
                      <Link to={`/productos/${p.id_producto}`} className="enlace-tabla">
                        {p.nombre_set}
                      </Link>
                    </td>
                    <td>{p.tema.nombre_tema}</td>
                    <td className="num">{formatearNumero(p.cant_piezas)}</td>
                    <td className={`num stock${bajo ? ' stock--bajo' : ''}`}>
                      {formatearNumero(p.cantidad_disponible)}
                    </td>
                    <td className="num">{formatearNumero(p.cantidad_reservada)}</td>
                    <td className="num">{formatearNumero(p.cantidad_minima)}</td>
                    <td>
                      <div className="acciones-fila">
                        <Link to={`/productos/${p.id_producto}`} className="boton-detalle">
                          Ficha
                        </Link>
                        {esJefe && (
                          <button
                            type="button"
                            className="boton-detalle"
                            onClick={() => setModal({ tipo: 'editar', producto: p })}
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </td>
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

      {modal?.tipo === 'nuevo' && (
        <FormProducto onClose={() => setModal(null)} onSaved={recargar} />
      )}
      {modal?.tipo === 'editar' && (
        <FormProducto
          producto={modal.producto}
          onClose={() => setModal(null)}
          onSaved={recargar}
        />
      )}
    </main>
  );
}
