import { useEffect, useState } from 'react';
import { actualizarProducto, crearProducto, fetchTemas } from '../api';
import { useToast } from '../context/useToast';
import type { Producto, Tema } from '../tipos';
import Modal from './Modal';

interface FormProductoProps {
  producto?: Producto | null;
  onClose: () => void;
  onSaved: () => void;
}

const CAMPOS_MEDIDAS = [
  { campo: 'peso_unitario_kg', etiqueta: 'Peso (kg)', placeholder: 'Ej: 13.2' },
  { campo: 'largo_cm', etiqueta: 'Largo (cm)', placeholder: 'Ej: 53' },
  { campo: 'ancho_cm', etiqueta: 'Ancho (cm)', placeholder: 'Ej: 38' },
  { campo: 'alto_cm', etiqueta: 'Alto (cm)', placeholder: 'Ej: 46' },
] as const;

type CampoMedida = (typeof CAMPOS_MEDIDAS)[number]['campo'];

export default function FormProducto({ producto, onClose, onSaved }: FormProductoProps) {
  const editar = Boolean(producto);
  const mostrarToast = useToast();

  const [temas, setTemas] = useState<Tema[]>([]);
  const [cargandoTemas, setCargandoTemas] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sku, setSku] = useState(producto?.sku ?? '');
  const [nombreSet, setNombreSet] = useState(producto?.nombre_set ?? '');
  const [idTema, setIdTema] = useState(producto ? String(producto.id_tema) : '');
  const [cantPiezas, setCantPiezas] = useState(producto ? String(producto.cant_piezas) : '');
  const [urlImagen, setUrlImagen] = useState(producto?.url_imagen ?? '');
  const [imagenRota, setImagenRota] = useState(false);
  const [medidas, setMedidas] = useState<Record<CampoMedida, string>>({
    peso_unitario_kg: producto?.peso_unitario_kg != null ? String(producto.peso_unitario_kg) : '',
    largo_cm: producto?.largo_cm != null ? String(producto.largo_cm) : '',
    ancho_cm: producto?.ancho_cm != null ? String(producto.ancho_cm) : '',
    alto_cm: producto?.alto_cm != null ? String(producto.alto_cm) : '',
  });

  useEffect(() => {
    let activo = true;
    fetchTemas()
      .then((data) => {
        if (!activo) return;
        setTemas(data);
        if (!producto && data.length > 0) setIdTema(String(data[0].id_tema));
      })
      .catch((err) => {
        if (activo) setError(err instanceof Error ? err.message : 'No se pudieron cargar los temas');
      })
      .finally(() => {
        if (activo) setCargandoTemas(false);
      });

    return () => {
      activo = false;
    };
  }, [producto]);

  const URL = urlImagen.trim();
  const mostrarVistaPrevia = URL.startsWith('https://') && !imagenRota;

  const cambiarMedida = (campo: CampoMedida, valor: string) => {
    setMedidas((actuales) => ({ ...actuales, [campo]: valor }));
  };

  const guardar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setError(null);

    const payload = {
      id_tema: Number(idTema),
      sku: sku.trim(),
      nombre_set: nombreSet.trim(),
      cant_piezas: Number(cantPiezas),
      ...(URL ? { url_imagen: URL } : {}),
      ...Object.fromEntries(
        CAMPOS_MEDIDAS.filter(({ campo }) => medidas[campo] !== '').map(({ campo }) => [
          campo,
          Number(medidas[campo]),
        ]),
      ),
    };

    try {
      if (producto) {
        await actualizarProducto(producto.id_producto, payload);
        mostrarToast('Producto actualizado.');
      } else {
        await crearProducto(payload);
        mostrarToast('Producto creado.');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el producto');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo={editar ? 'Editar producto' : 'Nuevo producto'} onClose={onClose}>
      <form className="modal-form" onSubmit={guardar}>
        {error && <p className="error">{error}</p>}

        <div className="campo">
          <label className="campo-label" htmlFor="prod-sku">SKU</label>
          <input
            id="prod-sku"
            className="campo-input"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            maxLength={20}
            required
          />
        </div>

        <div className="campo">
          <label className="campo-label" htmlFor="prod-nombre">Nombre del set</label>
          <input
            id="prod-nombre"
            className="campo-input"
            value={nombreSet}
            onChange={(e) => setNombreSet(e.target.value)}
            maxLength={255}
            required
          />
        </div>

        <div className="form-grid-2">
          <div className="campo">
            <label className="campo-label" htmlFor="prod-tema">Tema</label>
            <select
              id="prod-tema"
              className="campo-input"
              value={idTema}
              onChange={(e) => setIdTema(e.target.value)}
              required
              disabled={cargandoTemas}
            >
              {cargandoTemas && <option value="">Cargando temas…</option>}
              {!cargandoTemas && temas.length === 0 && <option value="">Sin temas</option>}
              {temas.map((tema) => (
                <option key={tema.id_tema} value={tema.id_tema}>
                  {tema.nombre_tema}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label className="campo-label" htmlFor="prod-piezas">Piezas</label>
            <input
              id="prod-piezas"
              className="campo-input"
              type="number"
              value={cantPiezas}
              onChange={(e) => setCantPiezas(e.target.value)}
              min={0}
              required
            />
          </div>
        </div>

        <div className="campo">
          <label className="campo-label" htmlFor="prod-imagen">URL de la imagen (opcional)</label>
          <input
            id="prod-imagen"
            className="campo-input"
            type="url"
            value={urlImagen}
            onChange={(e) => {
              setUrlImagen(e.target.value);
              setImagenRota(false);
            }}
            maxLength={500}
            pattern="https://.*"
            title="La URL debe comenzar con https://"
            placeholder="https://cdn.rebrickable.com/media/sets/75192-1.jpg"
          />
          <p className="campo-ayuda">Solo la dirección de la imagen (https).</p>
          {mostrarVistaPrevia && (
            <img
              src={URL}
              alt="Vista previa del set"
              className="preview-img"
              onError={() => setImagenRota(true)}
            />
          )}
        </div>

        <fieldset className="form-fieldset">
          <legend className="form-legend">Peso y medidas de la caja (opcional)</legend>
          <div className="form-grid-2">
            {CAMPOS_MEDIDAS.map(({ campo, etiqueta, placeholder }) => (
              <div key={campo}>
                <label className="campo-label" htmlFor={`prod-${campo}`}>{etiqueta}</label>
                <input
                  id={`prod-${campo}`}
                  className="campo-input"
                  type="number"
                  value={medidas[campo]}
                  onChange={(e) => cambiarMedida(campo, e.target.value)}
                  min={0.01}
                  step={0.01}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
        </fieldset>

        <div className="modal-footer">
          <button type="button" className="boton boton--secundario" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className="boton"
            disabled={guardando || cargandoTemas || temas.length === 0}
          >
            {guardando ? 'Guardando…' : editar ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
