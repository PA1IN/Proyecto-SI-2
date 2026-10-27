import { Entity, Column, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { InvMovimiento } from './inv-movimiento.entity.js';

@Entity('inv_despachos_operario')
export class InvDespachoOperario {
  @PrimaryColumn({ type: 'int' })
  id_movimiento: number;

  @OneToOne(() => InvMovimiento)
  @JoinColumn({ name: 'id_movimiento' })
  movimiento: InvMovimiento;

  // TODO Sprint 3: FK a logistica.
  @Column({ type: 'int', unique: true })
  id_despacho: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observaciones_picking: string | null;
}
