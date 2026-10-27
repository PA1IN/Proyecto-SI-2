import { useCallback, useEffect, useState } from 'react';
import { fetchBodegas } from './api';
import type { Bodega } from './tipos';

export default function Bodegas() {
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    setBodegas(await fetchBodegas());
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <main className="pagina">
      <div className="barra">
        <div className="barra-titulo">
          <h2>Bodegas</h2>
          <p className="resumen">{bodegas.length} bodegas operativas</p>
        </div>
        <div className="barra-acciones">
          <button
            className="boton boton--secundario"
            onClick={() => void cargar()}
            disabled={cargando}
          >
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
      </div>

      <div className="tabla-contenedor">
        <table className="tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre Bodega</th>
              <th>Ubicación Física</th>
            </tr>
          </thead>
          <tbody>
            {bodegas.map((b) => (
              <tr key={b.id_bodega}>
                <td>{b.id_bodega}</td>
                <td>{b.nombre_bodega}</td>
                <td>{b.ubicacion_fisica}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}