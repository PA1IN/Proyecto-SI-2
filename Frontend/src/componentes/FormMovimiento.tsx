import { useEffect, useState } from 'react';
import { fetchBodegas, fetchProductos, registrarAjuste, registrarIngreso } from '../api';
import { useToast } from '../context/useToast';
import type { Bodega, Producto } from '../tipos';
import Modal from './Modal';

interface FormMovimientoProps {
  tipo: 'INGRESO' | 'AJUSTE';
  productoId?: number;
  bodegaId?: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function FormMovimiento({
  tipo,
  productoId,
  bodegaId,
  onClose,
  onSaved,
}: FormMovimientoProps) {
  const mostrarToast = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [idProducto, setIdProducto] = useState(productoId ? String(productoId) : '');
  const [idBodega, setIdBodega] = useState(bodegaId ? String(bodegaId) : '');
  const [cantidad, setCantidad] = useState(tipo === 'INGRESO' ? '1' : '-1');
  const [idEmpleado, setIdEmpleado] = useState('1');

  useEffect(() => {
    let activo = true;
    Promise.all([fetchProductos(), fetchBodegas()])
      .then(([prods, bods]) => {
        if (!activo) return;
        setProductos(prods);
        setBodegas(bods);
        if (!bodegaId && bods.length > 0) setIdBodega(String(bods[0].id_bodega));
      })
      .catch((err) => {
        if (activo) setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [bodegaId]);

  const guardar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError(null);

    const cantidadNumero = Number(cantidad);
    if (!idProducto || !idBodega) {
      setError('Selecciona producto y bodega.');
      return;
    }
    if (tipo === 'INGRESO' && cantidadNumero <= 0) {
      setError('La cantidad debe ser mayor que 0.');
      return;
    }
    if (tipo === 'AJUSTE' && cantidadNumero === 0) {
      setError('La cantidad del ajuste no puede ser 0.');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        id_empleado: Number(idEmpleado),
        id_producto: Number(idProducto),
        id_bodega: Number(idBodega),
        cantidad: cantidadNumero,
      };
      if (tipo === 'INGRESO') {
        await registrarIngreso(payload);
        mostrarToast('Ingreso registrado.');
      } else {
        await registrarAjuste(payload);
        mostrarToast('Ajuste registrado.');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el movimiento');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      titulo={tipo === 'INGRESO' ? 'Registrar ingreso manual' : 'Registrar ajuste'}
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={guardar}>
        {error && <p className="error">{error}</p>}

        {cargando ? (
          <p className="campo-ayuda">Cargando productos y bodegas…</p>
        ) : (
          <>
            <div className="campo">
              <label className="campo-label" htmlFor="mov-producto">Producto</label>
              <select
                id="mov-producto"
                className="campo-input"
                value={idProducto}
                onChange={(e) => setIdProducto(e.target.value)}
                required
              >
                <option value="" disabled>Selecciona un producto…</option>
                {productos.map((producto) => (
                  <option key={producto.id_producto} value={producto.id_producto}>
                    {producto.sku} · {producto.nombre_set}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label className="campo-label" htmlFor="mov-bodega">Bodega</label>
              <select
                id="mov-bodega"
                className="campo-input"
                value={idBodega}
                onChange={(e) => setIdBodega(e.target.value)}
                required
              >
                <option value="" disabled>Selecciona una bodega…</option>
                {bodegas.map((bodega) => (
                  <option key={bodega.id_bodega} value={bodega.id_bodega}>
                    {bodega.nombre_bodega}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid-2">
              <div className="campo">
                <label className="campo-label" htmlFor="mov-cantidad">Cantidad</label>
                <input
                  id="mov-cantidad"
                  className="campo-input"
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  min={tipo === 'INGRESO' ? 1 : undefined}
                  required
                />
                <p className="campo-ayuda">
                  {tipo === 'INGRESO'
                    ? 'Unidades que se suman al stock disponible.'
                    : 'Negativo resta, positivo suma. Un ajuste corrige diferencias.'}
                </p>
              </div>

              <div className="campo">
                <label className="campo-label" htmlFor="mov-empleado">Empleado (ID)</label>
                <input
                  id="mov-empleado"
                  className="campo-input"
                  type="number"
                  value={idEmpleado}
                  onChange={(e) => setIdEmpleado(e.target.value)}
                  min={1}
                  required
                />
              </div>
            </div>
          </>
        )}

        <div className="modal-footer">
          <button type="button" className="boton boton--secundario" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="boton" disabled={guardando || cargando}>
            {guardando ? 'Registrando…' : tipo === 'INGRESO' ? 'Registrar ingreso' : 'Registrar ajuste'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
