import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('inv_temas')
export class InvTema {
  @PrimaryGeneratedColumn()
  id_tema: number;

  @Column({ type: 'varchar', length: 100 })
  nombre_tema: string;
}