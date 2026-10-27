import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { InvMovimiento } from './inv-movimiento.entity.js';

@Entity('inv_recepciones_compra')
export class InvRecepcionCompra {
  @PrimaryColumn({ type: 'int' })
  id_movimiento: number;

  @OneToOne(() => InvMovimiento)
  @JoinColumn({ name: 'id_movimiento' })
  movimiento: InvMovimiento;

  // TODO Sprint 3: FK a compras (proveedor y OC).
  @Column({ type: 'int' })
  id_proveedor: number;

  @Column({ type: 'int' })
  id_oc: number;

  @Column({ type: 'varchar', length: 50 })
  nro_guia_proveedor: string;
}
