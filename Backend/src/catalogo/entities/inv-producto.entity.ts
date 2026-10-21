import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { InvTema } from './inv-tema.entity.js'; // <-- Fíjate en el .js

@Entity('inv_producto')
export class InvProducto {
  @PrimaryGeneratedColumn()
  id_producto: number;

  @Column({ type: 'int' })
  id_tema: number;

  @ManyToOne(() => InvTema)
  @JoinColumn({ name: 'id_tema' })
  tema: InvTema;

  @Column({ type: 'varchar', length: 50, unique: true })
  sku: string;

  @Column({ type: 'varchar', length: 200 })
  nombre_set: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  coleccion: string;

  @Column({ type: 'int' })
  cant_piezas: number;

  @Column({ type: 'int' })
  edad_minima: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo_construccion: string;

  @Column({ type: 'int', default: 5 })
  stock_minimo: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}