import { InvMovimiento } from '../entities/inv-movimiento.entity.js';

export interface ResultadoDespacho {
  id_despacho: string;
  // Lo que salió de cada bodega.
  egreso: InvMovimiento;
  // Lo que no se recolectó y volvió a disponible; null si el despacho fue completo.
  liberacion: InvMovimiento | null;
}
