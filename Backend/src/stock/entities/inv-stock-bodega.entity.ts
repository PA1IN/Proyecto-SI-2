import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InvProducto } from '../../catalogo/entities/inv-producto.entity.js';
import { InvBodegas } from './inv-bodegas.entity.js';

@Entity('inv_stock_bodega')
export class InvStockBodega {
  @PrimaryColumn({ type: 'int' })
  id_producto: number;

  @PrimaryColumn({ type: 'int' })
  id_bodega: number;

  @ManyToOne(() => InvProducto)
  @JoinColumn({ name: 'id_producto' })
  producto: InvProducto;

  @ManyToOne(() => InvBodegas)
  @JoinColumn({ name: 'id_bodega' })
  bodega: InvBodegas;

  @Column({ type: 'int', default: 0 })
  cantidad_disponible: number;

  @Column({ type: 'int', default: 0 })
  cantidad_reservada: number;

  @Column({ type: 'int', default: 0})
  cantidad_minima: number;
}