import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvBodegas } from '../entities/inv-bodegas.entity.js';

@Injectable()
export class BodegaRepository {
  constructor(
    @InjectRepository(InvBodegas)
    private readonly ormRepo: Repository<InvBodegas>,
  ) {}

  async findAll(): Promise<InvBodegas[]> {
    return this.ormRepo.find({
      order: { id_bodega: 'ASC' },
    });
  }
}
