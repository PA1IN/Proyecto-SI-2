import { useState } from 'react';
import { actualizarBodega, crearBodega } from '../api';
import { useToast } from '../context/useToast';
import type { Bodega } from '../tipos';
import Modal from './Modal';

interface FormBodegaProps {
  bodega?: Bodega | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function FormBodega({ bodega, onClose, onSaved }: FormBodegaProps) {
  const mostrarToast = useToast();
  const [nombre, setNombre] = useState(bodega?.nombre_bodega ?? '');
  const [ubicacion, setUbicacion] = useState(bodega?.ubicacion_fisica ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setError(null);

    try {
      const payload = {
        nombre_bodega: nombre.trim(),
        ubicacion_fisica: ubicacion.trim(),
      };
      if (bodega) {
        await actualizarBodega(bodega.id_bodega, payload);
        mostrarToast('Bodega actualizada.');
      } else {
        await crearBodega(payload);
        mostrarToast('Bodega creada.');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la bodega');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo={bodega ? 'Editar bodega' : 'Nueva bodega'} onClose={onClose}>
      <form className="modal-form" onSubmit={guardar}>
        {error && <p className="error">{error}</p>}

        <div className="campo">
          <label className="campo-label" htmlFor="bod-nombre">Nombre de la bodega</label>
          <input
            id="bod-nombre"
            className="campo-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={100}
            required
          />
        </div>

        <div className="campo">
          <label className="campo-label" htmlFor="bod-ubicacion">Ubicación física</label>
          <input
            id="bod-ubicacion"
            className="campo-input"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            maxLength={255}
            placeholder="Pasillo, rack o dirección de acopio"
            required
          />
          <p className="campo-ayuda">
            Este dato lo usa Logística para el picking. No hay eliminación: las FKs usan RESTRICT.
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" className="boton boton--secundario" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="boton" disabled={guardando}>
            {guardando ? 'Guardando…' : bodega ? 'Guardar cambios' : 'Crear bodega'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
