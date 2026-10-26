import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { InvDetalleMovimiento } from './inv-detalle-movimiento.entity.js';

export type TipoOperacion =
  'INGRESO' | 'EGRESO' | 'RESERVA' | 'LIBERACION' | 'AJUSTE' | 'DEVOLUCION';

export type EstadoMovimiento = 'PENDIENTE' | 'COMPLETADO' | 'ANULADO';

@Entity('inv_movimiento')
export class InvMovimiento {
  @PrimaryGeneratedColumn()
  id_movimiento: number;

  // TODO Sprint 3: FK a rrhh; en el paso 8 sale del token.
  @Column({ type: 'int' })
  id_empleado: number;

  @Column({ type: 'int', nullable: true })
  id_pedido: number | null;

  @Column({ type: 'int', nullable: true })
  id_devolucion: number | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  fecha_registro: Date;

  @Column({ type: 'varchar', length: 20 })
  tipo_operacion: TipoOperacion;

  @Column({ type: 'varchar', length: 20 })
  estado: EstadoMovimiento;

  @OneToMany(() => InvDetalleMovimiento, (detalle) => detalle.movimiento)
  detalles: InvDetalleMovimiento[];
}
