import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvProducto } from '../entities/inv-producto.entity.js';
import { CrearProductoDto } from '../dto/crear-producto.dto.js';
import { ProductoConStock } from '../interfaces/producto-con-stock.interface.js';

@Injectable()
export class ProductoRepository {
  constructor(
    @InjectRepository(InvProducto)
    private readonly ormRepo: Repository<InvProducto>,
  ) {}

  async findAllActivos(): Promise<InvProducto[]> {
    return this.ormRepo.find({
      where: { activo: true },
      relations: { tema: true },
      order: { id_producto: 'ASC' },
    });
  }

  async findBySku(sku: string): Promise<InvProducto | null> {
    return this.ormRepo.findOne({
      where: { sku },
      relations: { tema: true },
    });
  }

  async crear(datos: CrearProductoDto): Promise<InvProducto> {
    const nuevo = this.ormRepo.create(datos);
    return this.ormRepo.save(nuevo);
  }

  async findById(id_producto: number): Promise<InvProducto | null> {
    return this.ormRepo.findOne({
      where: { id_producto },
      relations: { tema: true },
    });
  }

  // Mismo formato que GET /productos más el stock total. Sin id: solo activos; con id: el producto aunque esté inactivo.
  async findConStock(id_producto?: number): Promise<ProductoConStock[]> {
    return this.ormRepo.query(
      `SELECT p.id_producto, p.id_tema, p.sku, p.nombre_set, p.cant_piezas, p.activo, p.url_imagen,
              json_build_object('id_tema', t.id_tema, 'nombre_tema', t.nombre_tema) AS tema,
              COALESCE(SUM(s.cantidad_disponible), 0)::int AS cantidad_disponible
       FROM inventario.inv_producto p
       JOIN inventario.inv_temas t ON t.id_tema = p.id_tema
       LEFT JOIN inventario.inv_stock_bodega s ON s.id_producto = p.id_producto
       WHERE ($1::int IS NULL AND p.activo) OR p.id_producto = $1
       GROUP BY p.id_producto, t.id_tema
       ORDER BY p.id_producto`,
      [id_producto ?? null],
    );
  }

  async actualizar(
    id_producto: number,
    datos: Partial<InvProducto>,
  ): Promise<void> {
    await this.ormRepo.update(id_producto, datos);
  }
}
