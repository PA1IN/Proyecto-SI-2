import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, fetchTemas } from './api';
import type { MedidasProducto, Tema } from './tipos';

type MedidasFormulario = Record<keyof MedidasProducto, string>;

const MEDIDAS_VACIAS: MedidasFormulario = {
  peso_unitario_kg: '',
  largo_cm: '',
  ancho_cm: '',
  alto_cm: '',
};

const CAMPOS_MEDIDAS: { campo: keyof MedidasFormulario; etiqueta: string; placeholder: string }[] = [
  { campo: 'peso_unitario_kg', etiqueta: 'Peso (kg)', placeholder: 'Ej: 13.2' },
  { campo: 'largo_cm', etiqueta: 'Largo (cm)', placeholder: 'Ej: 53' },
  { campo: 'ancho_cm', etiqueta: 'Ancho (cm)', placeholder: 'Ej: 38' },
  { campo: 'alto_cm', etiqueta: 'Alto (cm)', placeholder: 'Ej: 46' },
];

const estiloLabel = { display: 'block', marginBottom: '8px', fontWeight: 600 } as const;
const estiloInput = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' } as const;
const estiloAyuda = { margin: '6px 0 0', fontSize: '0.82rem', color: '#61707f' } as const;

export default function CrearProducto() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para el formulario
  const [sku, setSku] = useState('');
  const [nombreSet, setNombreSet] = useState('');
  const [idTema, setIdTema] = useState('');
  const [cantPiezas, setCantPiezas] = useState(0);
  const [urlImagen, setUrlImagen] = useState('');
  const [imagenRota, setImagenRota] = useState(false);
  const [medidas, setMedidas] = useState<MedidasFormulario>(MEDIDAS_VACIAS);

  const [temas, setTemas] = useState<Tema[]>([]);
  const [cargandoTemas, setCargandoTemas] = useState(true);

  useEffect(() => {
    let activo = true;

    fetchTemas()
      .then((data) => {
        if (!activo) return;
        setTemas(data);
        if (data.length > 0) setIdTema(String(data[0].id_tema));
      })
      .catch((err) => {
        if (activo) {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar los temas');
        }
      })
      .finally(() => {
        if (activo) setCargandoTemas(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const cambiarMedida = (campo: keyof MedidasFormulario, valor: string) => {
    setMedidas((actuales) => ({ ...actuales, [campo]: valor }));
  };

  const urlLimpia = urlImagen.trim();
  const mostrarVistaPrevia = urlLimpia.startsWith('https://') && !imagenRota;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const body: Record<string, string | number> = {
      sku,
      nombre_set: nombreSet,
      id_tema: Number(idTema),
      cant_piezas: Number(cantPiezas),
    };
    if (urlLimpia) body.url_imagen = urlLimpia;
    for (const { campo } of CAMPOS_MEDIDAS) {
      if (medidas[campo] !== '') body[campo] = Number(medidas[campo]);
    }

    try {
      const res = await apiFetch('/api/v1/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
        throw new Error(msg || 'Error al crear el producto');
      }

      const creado = (await res.json()) as { id_producto: number; nombre_set: string };

      navigate('/', {
        state: {
          mensaje: `Producto "${creado.nombre_set}" creado correctamente.`,
          idProducto: creado.id_producto,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="pagina">
      <div className="barra">
        <h2 style={{ margin: 0 }}>Ingresar Nuevo Producto</h2>
        <button className="boton boton--secundario" onClick={() => navigate('/')}>
          Volver
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #d9dee5', maxWidth: '500px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={estiloLabel}>SKU</label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            maxLength={20}
            required
            style={estiloInput}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={estiloLabel}>Nombre del Set</label>
          <input
            type="text"
            value={nombreSet}
            onChange={(e) => setNombreSet(e.target.value)}
            maxLength={255}
            required
            style={estiloInput}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={estiloLabel}>Tema</label>
          <select
            value={idTema}
            onChange={(e) => setIdTema(e.target.value)}
            required
            disabled={cargandoTemas}
            style={{ ...estiloInput, background: '#fff' }}
          >
            {cargandoTemas && <option value="">Cargando temas…</option>}
            {!cargandoTemas && temas.length === 0 && (
              <option value="">Sin temas disponibles</option>
            )}
            {temas.map((tema) => (
              <option key={tema.id_tema} value={tema.id_tema}>
                {tema.nombre_tema}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={estiloLabel}>Cantidad de Piezas</label>
          <input
            type="number"
            value={cantPiezas}
            onChange={(e) => setCantPiezas(Number(e.target.value))}
            min={0}
            required
            style={estiloInput}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={estiloLabel}>URL de la imagen (opcional)</label>
          <input
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
            style={estiloInput}
          />
          <p style={estiloAyuda}>Solo la dirección de la imagen (https). No se suben archivos.</p>
          {mostrarVistaPrevia && (
            <img
              src={urlLimpia}
              alt="Vista previa del set"
              onError={() => setImagenRota(true)}
              style={{ display: 'block', marginTop: '10px', maxWidth: '100%', maxHeight: '180px', borderRadius: '6px', border: '1px solid #e6e0d7' }}
            />
          )}
          {urlLimpia.startsWith('https://') && imagenRota && (
            <p style={{ ...estiloAyuda, color: '#b42318' }}>
              No se pudo cargar la imagen. Revisa que la URL sea correcta.
            </p>
          )}
        </div>

        <fieldset style={{ marginBottom: '24px', padding: '16px', border: '1px solid #e6e0d7', borderRadius: '8px' }}>
          <legend style={{ fontWeight: 600, padding: '0 6px' }}>Peso y medidas de la caja (opcional)</legend>
          <p style={{ ...estiloAyuda, margin: '0 0 12px' }}>
            Los datos que dejes vacíos se estiman según la cantidad de piezas.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {CAMPOS_MEDIDAS.map(({ campo, etiqueta, placeholder }) => (
              <div key={campo}>
                <label style={estiloLabel}>{etiqueta}</label>
                <input
                  type="number"
                  value={medidas[campo]}
                  onChange={(e) => cambiarMedida(campo, e.target.value)}
                  min={0.01}
                  step={0.01}
                  placeholder={placeholder}
                  style={estiloInput}
                />
              </div>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="boton boton--bloque"
          disabled={cargando || cargandoTemas || temas.length === 0}
        >
          {cargando ? 'Guardando...' : 'Crear Producto'}
        </button>
      </form>
    </main>
  );
}