import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvTema } from '../entities/inv-tema.entity.js';

@Injectable()
export class TemaRepository {
  constructor(
    @InjectRepository(InvTema)
    private readonly ormRepo: Repository<InvTema>,
  ) {}

  async findById(idTema: number): Promise<InvTema | null> {
    return this.ormRepo.findOne({
      where: { id_tema: idTema },
    });
  }

  async findAll(): Promise<InvTema[]> {
    return this.ormRepo.find({
      order: { nombre_tema: 'ASC' },
    });
  }
}
