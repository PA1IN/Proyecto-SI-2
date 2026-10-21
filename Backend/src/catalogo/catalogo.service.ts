import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { ProductoRepository } from './repositories/producto.repository.js';
import { TemaRepository } from './repositories/tema.repository.js';
import { InvProducto } from './entities/inv-producto.entity.js';
import { InvTema } from './entities/inv-tema.entity.js';
import { CrearProductoDto } from './dto/crear-producto.dto.js';

@Injectable()
export class CatalogoService {
  constructor(
    private readonly productoRepo: ProductoRepository,
    private readonly temaRepo: TemaRepository,
  ) {}

  async obtenerProductos(): Promise<InvProducto[]> {
    return this.productoRepo.findAllActivos();
  }

  async obtenerTemas(): Promise<InvTema[]> {
    return this.temaRepo.findAll();
  }

  async crearProducto(dto: CrearProductoDto): Promise<InvProducto> {
    const temaExiste = await this.temaRepo.findById(dto.id_tema);
    if (!temaExiste) {
      throw new NotFoundException(`El tema con ID ${dto.id_tema} no existe`);
    }

    const skuDuplicado = await this.productoRepo.findBySku(dto.sku);
    if (skuDuplicado) {
      throw new ConflictException(`Ya existe un producto con el SKU ${dto.sku}`);
    }

    return this.productoRepo.crear(dto);
  }
}