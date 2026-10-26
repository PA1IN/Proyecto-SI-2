import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';
import { InvProducto } from '../../catalogo/entities/inv-producto.entity.js';
import { InvBodegas } from '../../stock/entities/inv-bodegas.entity.js';
import { InvMovimiento } from './inv-movimiento.entity.js';

@Entity('inv_detalles_movimiento')
export class InvDetalleMovimiento {
  @PrimaryGeneratedColumn()
  id_detalle: number;

  @Column({ type: 'int' })
  id_movimiento: number;

  // Relation<> evita leer la clase en la metadata: la importación es circular en ESM.
  @ManyToOne(() => InvMovimiento, (movimiento) => movimiento.detalles)
  @JoinColumn({ name: 'id_movimiento' })
  movimiento: Relation<InvMovimiento>;

  @Column({ type: 'int' })
  id_producto: number;

  @ManyToOne(() => InvProducto)
  @JoinColumn({ name: 'id_producto' })
  producto: InvProducto;

  @Column({ type: 'int' })
  id_bodega: number;

  @ManyToOne(() => InvBodegas)
  @JoinColumn({ name: 'id_bodega' })
  bodega: InvBodegas;

  // Negativa solo en un AJUSTE que descuenta.
  @Column({ type: 'int' })
  cantidad: number;
}
