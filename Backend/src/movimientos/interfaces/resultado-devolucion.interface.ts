import { InvMovimiento } from '../entities/inv-movimiento.entity.js';

export interface ResultadoDevolucion {
  devolucion: InvMovimiento;
  // Solo se crea cuando apto = false (producto dañado).
  ajuste: InvMovimiento | null;
}