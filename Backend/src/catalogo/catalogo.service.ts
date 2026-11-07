import {
  BadRequestException,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProductoRepository } from './repositories/producto.repository.js';
import { TemaRepository } from './repositories/tema.repository.js';
import { InvProducto } from './entities/inv-producto.entity.js';
import { InvTema } from './entities/inv-tema.entity.js';
import { CrearProductoDto } from './dto/crear-producto.dto.js';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto.js';

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
      throw new ConflictException(
        `Ya existe un producto con el SKU ${dto.sku}`,
      );
    }

    return this.productoRepo.crear(dto);
  }

  async actualizarProducto(id: number, dto: ActualizarProductoDto): Promise<InvProducto> {
    // Sin campos, TypeORM lanza error al actualizar y saldría un 500.
    if (Object.values(dto).every((v) => v === undefined)) {
      throw new BadRequestException('Debe enviar al menos un campo a actualizar');
    }

    const producto = await this.productoRepo.findById(id);
    if (!producto) {
      throw new NotFoundException(`Producto ${id} no existe`);
    }

    if (dto.sku && dto.sku !== producto.sku) {
      const skuDuplicado = await this.productoRepo.findBySku(dto.sku);
      if (skuDuplicado) {
        throw new ConflictException(`SKU ${dto.sku} en uso`);
      } 
    }

    if (dto.id_tema) {
        const temaExiste = await this.temaRepo.findById(dto.id_tema);
        if (!temaExiste) {
          throw new NotFoundException(`Tema ${dto.id_tema} no existe`);
        }
    }

    await this.productoRepo.actualizar(id, dto);
    return(await this.productoRepo.findById(id))!;
  }

  async darDeBaja(id: number): Promise<void> {
    const producto = await this.productoRepo.findById(id);
    if (!producto) {
      throw new  NotFoundException(`Producto ${id} no existe`);
    }
    await this.productoRepo.actualizar(id, { activo: false });
  }
}
