import { InvMovimiento } from '../entities/inv-movimiento.entity.js';

export interface ResultadoRecepcion {
  id_oc: number;
  id_proveedor: number;
  nro_guia_proveedor: string;
  ingreso: InvMovimiento;
}
