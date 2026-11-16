import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InvTema } from './inv-tema.entity.js'; // <-- Fíjate en el .js

// pg devuelve numeric como texto: se convierte a número para que la API responda 1.59 y no "1.59".
const decimal = {
  type: 'numeric',
  precision: 10,
  scale: 2,
  transformer: {
    to: (valor?: number | null) => valor,
    from: (valor: string | null) => (valor === null ? null : Number(valor)),
  },
} as const;

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

  @Column({ type: 'int' })
  cant_piezas: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url_imagen: string | null;

  // Peso y medidas de la caja, para Logística (db/ddl/06).
  @Column({ ...decimal, nullable: true })
  peso_unitario_kg: number | null;

  @Column({ ...decimal, nullable: true })
  largo_cm: number | null;

  @Column({ ...decimal, nullable: true })
  alto_cm: number | null;

  @Column({ ...decimal, nullable: true })
  ancho_cm: number | null;
}
