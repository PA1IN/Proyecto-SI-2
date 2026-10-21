import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('inv_bodegas')
export class InvBodegas {
  @PrimaryGeneratedColumn()
  id_bodega: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre_bodega: string;

  @Column({ type: 'varchar', length: 200 })
  ubicacion_fisica: string;
}