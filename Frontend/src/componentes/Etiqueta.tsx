import type { EstadoMovimiento, TipoOperacion } from '../tipos';

export function EtiquetaTipo({ tipo }: { tipo: TipoOperacion }) {
  return <span className={`tag tag--${tipo.toLowerCase()}`}>{tipo}</span>;
}

export function EtiquetaEstado({ estado }: { estado: EstadoMovimiento }) {
  return <span className={`tag tag--estado-${estado.toLowerCase()}`}>{estado}</span>;
}
