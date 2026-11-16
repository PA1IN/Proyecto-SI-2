import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, In, QueryFailedError } from 'typeorm';
import { InvProducto } from '../catalogo/entities/inv-producto.entity.js';
import { InvBodegas } from '../stock/entities/inv-bodegas.entity.js';
import { StockRepository } from '../stock/repositories/stock.repository.js';
import { InvMovimiento } from './entities/inv-movimiento.entity.js';
import { RegistrarIngresoDto } from './dto/registrar-ingreso.dto.js';
import { RegistrarAjusteDto } from './dto/registrar-ajuste.dto.js';
import { RegistrarReservaDto } from './dto/registrar-reserva.dto.js';
import { LiberarReservaDto } from './dto/liberar-reserva.dto.js';
import { ReservaPedido } from './interfaces/reserva-pedido.interface.js';
import { RegistrarDespachoDto } from './dto/registrar-despacho.dto.js';
import { ResultadoDespacho } from './interfaces/resultado-despacho.interface.js';
import { RegistrarRecepcionDto } from './dto/registrar-recepcion.dto.js';
import { ResultadoRecepcion } from './interfaces/resultado-recepcion.interface.js';
import { InvRecepcionCompra } from './entities/inv-recepcion-compra.entity.js';
import {
  LineaStock,
  repartirDespacho,
} from './utils/repartir-despacho.util.js';
import { ReservaStrategy } from './strategies/reserva.strategy.js';
import { MovimientoRepository } from './repositories/movimiento.repository.js';

@Injectable()
export class MovimientosService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly stockRepo: StockRepository,
    private readonly movimientoRepo: MovimientoRepository,
    private readonly reservaStrategy: ReservaStrategy,
  ) {}

  async obtenerHistorial(): Promise<InvMovimiento[]> {
    return this.movimientoRepo.findHistorial();
  }

  async obtenerMovimientoPorId(id: number): Promise<InvMovimiento> {
    const mov = await this.movimientoRepo.findById(id);
    if (!mov) {
      throw new NotFoundException(
        `Movimiento ${id} no encontrado en el sistema`,
      );
    }
    return mov;
  }

  async registrarIngreso(dto: RegistrarIngresoDto): Promise<InvMovimiento> {
    return this.dataSource.transaction(async (manager) => {
      const producto = await manager.findOneBy(InvProducto, {
        id_producto: dto.id_producto,
      });
      if (!producto) {
        throw new NotFoundException(
          `El producto con ID ${dto.id_producto} no existe`,
        );
      }
      if (!producto.activo) {
        throw new NotFoundException(
          `El producto con ID ${dto.id_producto} está inactivo`,
        );
      }

      const bodegaExiste = await manager.existsBy(InvBodegas, {
        id_bodega: dto.id_bodega,
      });
      if (!bodegaExiste) {
        throw new NotFoundException(
          `La bodega con ID ${dto.id_bodega} no existe`,
        );
      }

      const movimiento = await this.movimientoRepo.crearCabecera(
        {
          // TODO paso 8: sacarlo del token.
          id_empleado: dto.id_empleado,
          tipo_operacion: 'INGRESO',
          estado: 'COMPLETADO',
        },
        manager,
      );

      const detalle = await this.movimientoRepo.crearDetalle(
        {
          id_movimiento: movimiento.id_movimiento,
          id_producto: dto.id_producto,
          id_bodega: dto.id_bodega,
          cantidad: dto.cantidad,
        },
        manager,
      );

      await this.stockRepo.sumarDisponible(
        dto.id_producto,
        dto.id_bodega,
        dto.cantidad,
        manager,
      );

      movimiento.detalles = [detalle];
      return movimiento;
    });
  }

  async obtenerReservaPorPedido(idPedido: number): Promise<ReservaPedido> {
    const reserva = await this.movimientoRepo.findPorPedido(
      idPedido,
      'RESERVA',
    );
    if (!reserva) {
      throw new NotFoundException(`El pedido ${idPedido} no tiene una reserva`);
    }
    // findById trae el producto y la bodega de cada línea.
    const { detalles } = (await this.movimientoRepo.findById(
      reserva.id_movimiento,
    ))!;
    return {
      id_pedido: idPedido,
      id_movimiento: reserva.id_movimiento,
      estado: reserva.estado,
      fecha_registro: reserva.fecha_registro,
      lineas: detalles.map((d) => ({
        id_producto: d.id_producto,
        sku: d.producto.sku,
        nombre_set: d.producto.nombre_set,
        id_bodega: d.id_bodega,
        nombre_bodega: d.bodega.nombre_bodega,
        ubicacion_fisica: d.bodega.ubicacion_fisica,
        cantidad: d.cantidad,
      })),
    };
  }

  // Todo o nada: si una línea no alcanza, ReservaStrategy lanza 409 y se deshace todo.
  // Idempotente por id_pedido: un reintento devuelve la reserva que ya existe.
  async registrarReserva(dto: RegistrarReservaDto): Promise<InvMovimiento> {
    const existente = await this.movimientoRepo.findPorPedido(
      dto.id_pedido,
      'RESERVA',
    );
    if (existente) return this.reservaExistente(existente);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const ids = dto.lineas.map((l) => l.id_producto);
        const productos = await manager.findBy(InvProducto, {
          id_producto: In(ids),
        });
        for (const id of ids) {
          const producto = productos.find((p) => p.id_producto === id);
          if (!producto?.activo) {
            throw new NotFoundException(
              `El producto con ID ${id} no existe o está inactivo`,
            );
          }
        }

        // La cabecera va primero: si llega otra reserva del mismo pedido, el índice único
        // la frena aquí, antes de tocar el stock.
        const movimiento = await this.movimientoRepo.crearCabecera(
          {
            id_empleado: null,
            id_pedido: dto.id_pedido,
            tipo_operacion: 'RESERVA',
            estado: 'PENDIENTE',
          },
          manager,
        );

        // Se bloquea el stock siempre en el mismo orden para que dos pedidos no se traben.
        const lineas = [...dto.lineas].sort(
          (a, b) => a.id_producto - b.id_producto,
        );
        movimiento.detalles = [];
        for (const linea of lineas) {
          const asignaciones = await this.reservaStrategy.ejecutar(
            {
              idProducto: linea.id_producto,
              cantidad: linea.cantidad,
              idPedido: dto.id_pedido,
            },
            manager,
          );
          for (const asignacion of asignaciones) {
            movimiento.detalles.push(
              await this.movimientoRepo.crearDetalle(
                {
                  id_movimiento: movimiento.id_movimiento,
                  id_producto: linea.id_producto,
                  id_bodega: asignacion.id_bodega,
                  cantidad: asignacion.cantidad_asignada,
                },
                manager,
              ),
            );
          }
        }
        return movimiento;
      });
    } catch (error) {
      // Dos reintentos simultáneos: el que perdió devuelve la reserva del que ganó.
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { constraint?: string })?.constraint ===
          'uq_reserva_por_pedido'
      ) {
        const reserva = await this.movimientoRepo.findPorPedido(
          dto.id_pedido,
          'RESERVA',
        );
        if (reserva) return this.reservaExistente(reserva);
      }
      throw error;
    }
  }

  // Un reintento recibe la misma reserva; un pedido cancelado no se reactiva (acordado con
  // e-Commerce): debe crear otro pedido con un id nuevo.
  private reservaExistente(reserva: InvMovimiento): InvMovimiento {
    if (reserva.estado === 'ANULADO') {
      throw new ConflictException(
        `El pedido ${reserva.id_pedido} fue cancelado; cree un pedido nuevo`,
      );
    }
    return reserva;
  }

  // Devuelve todo lo reservado del pedido a disponible, en las mismas bodegas, crea la
  // LIBERACION y deja la reserva ANULADO. Idempotente: si ya estaba anulada, devuelve la
  // liberación existente.
  async liberarReserva(dto: LiberarReservaDto): Promise<InvMovimiento> {
    return this.dataSource.transaction(async (manager) => {
      const reserva = await this.movimientoRepo.findReservaParaActualizar(
        dto.id_pedido,
        manager,
      );
      if (!reserva) {
        throw new NotFoundException(
          `El pedido ${dto.id_pedido} no tiene una reserva`,
        );
      }
      if (reserva.estado === 'ANULADO') {
        const liberacion = await this.movimientoRepo.findPorPedido(
          dto.id_pedido,
          'LIBERACION',
        );
        if (liberacion) return liberacion;
      }
      if (reserva.estado !== 'PENDIENTE') {
        // COMPLETADO = ya se despachó; no se puede liberar.
        throw new ConflictException(
          `La reserva del pedido ${dto.id_pedido} está ${reserva.estado}`,
        );
      }

      for (const detalle of reserva.detalles) {
        const liberado = await this.stockRepo.liberarReservado(
          detalle.id_producto,
          detalle.id_bodega,
          detalle.cantidad,
          manager,
        );
        if (!liberado) {
          throw new ConflictException(
            `El stock reservado del producto ${detalle.id_producto} en la bodega ${detalle.id_bodega} no coincide con la reserva`,
          );
        }
      }

      const liberacion = await this.movimientoRepo.crearCabecera(
        {
          id_empleado: null,
          id_pedido: dto.id_pedido,
          tipo_operacion: 'LIBERACION',
          estado: 'COMPLETADO',
        },
        manager,
      );
      liberacion.detalles = [];
      for (const detalle of reserva.detalles) {
        liberacion.detalles.push(
          await this.movimientoRepo.crearDetalle(
            {
              id_movimiento: liberacion.id_movimiento,
              id_producto: detalle.id_producto,
              id_bodega: detalle.id_bodega,
              cantidad: detalle.cantidad,
            },
            manager,
          ),
        );
      }

      await this.movimientoRepo.actualizarEstado(
        reserva.id_movimiento,
        'ANULADO',
        manager,
      );
      return liberacion;
    });
  }

  // Logística confirma la guía: EGRESO de lo recolectado y LIBERACION de lo que faltó, en una
  // transacción; la reserva queda COMPLETADO. Idempotente por id_despacho.
  async registrarDespacho(
    dto: RegistrarDespachoDto,
  ): Promise<ResultadoDespacho> {
    return this.dataSource.transaction(async (manager) => {
      // Bloquear la reserva serializa dos despachos del mismo pedido.
      const reserva = await this.movimientoRepo.findReservaParaActualizar(
        dto.id_pedido,
        manager,
      );
      if (!reserva) {
        throw new NotFoundException(
          `El pedido ${dto.id_pedido} no tiene una reserva`,
        );
      }

      const egresoPrevio = await this.movimientoRepo.findEgresoPorDespacho(
        dto.id_despacho,
        manager,
      );
      if (egresoPrevio) {
        if (egresoPrevio.id_pedido !== dto.id_pedido) {
          throw new ConflictException(
            `La guía ${dto.id_despacho} ya se usó en el pedido ${egresoPrevio.id_pedido}`,
          );
        }
        return {
          id_despacho: dto.id_despacho,
          egreso: egresoPrevio,
          liberacion: await this.movimientoRepo.findPorPedido(
            dto.id_pedido,
            'LIBERACION',
          ),
        };
      }
      if (reserva.estado !== 'PENDIENTE') {
        throw new ConflictException(
          `La reserva del pedido ${dto.id_pedido} está ${reserva.estado}`,
        );
      }

      const reparto = repartirDespacho(
        reserva.detalles.map(({ id_producto, id_bodega, cantidad }) => ({
          id_producto,
          id_bodega,
          cantidad,
        })),
        dto.lineas,
      );

      for (const linea of reparto.egreso) {
        const ok = await this.stockRepo.descontarReservado(
          linea.id_producto,
          linea.id_bodega,
          linea.cantidad,
          manager,
        );
        if (!ok) throw this.stockInconsistente(linea);
      }
      for (const linea of reparto.liberacion) {
        const ok = await this.stockRepo.liberarReservado(
          linea.id_producto,
          linea.id_bodega,
          linea.cantidad,
          manager,
        );
        if (!ok) throw this.stockInconsistente(linea);
      }

      const egreso = await this.crearMovimiento(
        'EGRESO',
        dto,
        reparto.egreso,
        manager,
      );
      await this.movimientoRepo.crearDespacho(
        {
          id_movimiento: egreso.id_movimiento,
          id_despacho: dto.id_despacho,
          observaciones_picking: dto.observaciones_picking ?? null,
        },
        manager,
      );
      const liberacion = reparto.liberacion.length
        ? await this.crearMovimiento(
            'LIBERACION',
            dto,
            reparto.liberacion,
            manager,
          )
        : null;

      await this.movimientoRepo.actualizarEstado(
        reserva.id_movimiento,
        'COMPLETADO',
        manager,
      );
      return { id_despacho: dto.id_despacho, egreso, liberacion };
    });
  }

  // Logística recibe una OC en el muelle: INGRESO de lo neto (recibido menos dañado) por bodega.
  // Idempotente por id_oc + nro_guia_proveedor; el mismo par con otros datos da 409 (acordado 16-11).
  async registrarRecepcion(
    dto: RegistrarRecepcionDto,
  ): Promise<ResultadoRecepcion> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const previa = await this.movimientoRepo.findRecepcion(
          dto.id_oc,
          dto.nro_guia_proveedor,
          manager,
        );
        if (previa) return this.recepcionExistente(dto, previa);

        const idsProducto = [...new Set(dto.lineas.map((l) => l.id_producto))];
        const productos = await manager.findBy(InvProducto, {
          id_producto: In(idsProducto),
        });
        for (const id of idsProducto) {
          if (!productos.find((p) => p.id_producto === id)?.activo) {
            throw new NotFoundException(
              `El producto con ID ${id} no existe o está inactivo`,
            );
          }
        }
        const idsBodega = [...new Set(dto.lineas.map((l) => l.id_bodega))];
        const bodegas = await manager.findBy(InvBodegas, {
          id_bodega: In(idsBodega),
        });
        const faltante = idsBodega.find(
          (id) => !bodegas.some((b) => b.id_bodega === id),
        );
        if (faltante) {
          throw new NotFoundException(`La bodega con ID ${faltante} no existe`);
        }

        const ingreso = await this.movimientoRepo.crearCabecera(
          {
            id_empleado: dto.id_empleado,
            tipo_operacion: 'INGRESO',
            estado: 'COMPLETADO',
          },
          manager,
        );
        // La fila de recepción va antes del stock: si un reintento simultáneo llegó primero,
        // el UNIQUE (id_oc, nro_guia_proveedor) frena aquí, sin haber sumado nada.
        await this.movimientoRepo.crearRecepcion(
          {
            id_movimiento: ingreso.id_movimiento,
            id_oc: dto.id_oc,
            id_proveedor: dto.id_proveedor,
            nro_guia_proveedor: dto.nro_guia_proveedor,
          },
          manager,
        );
        ingreso.detalles = [];
        for (const { id_producto, id_bodega, cantidad } of dto.lineas) {
          await this.stockRepo.sumarDisponible(
            id_producto,
            id_bodega,
            cantidad,
            manager,
          );
          ingreso.detalles.push(
            await this.movimientoRepo.crearDetalle(
              {
                id_movimiento: ingreso.id_movimiento,
                id_producto,
                id_bodega,
                cantidad,
              },
              manager,
            ),
          );
        }
        return {
          id_oc: dto.id_oc,
          id_proveedor: dto.id_proveedor,
          nro_guia_proveedor: dto.nro_guia_proveedor,
          ingreso,
        };
      });
    } catch (error) {
      // Dos reintentos simultáneos: el que perdió responde con la recepción del que ganó.
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { constraint?: string })?.constraint ===
          'uq_recepcion_oc_guia'
      ) {
        const previa = await this.movimientoRepo.findRecepcion(
          dto.id_oc,
          dto.nro_guia_proveedor,
          this.dataSource.manager,
        );
        if (previa) return this.recepcionExistente(dto, previa);
      }
      throw error;
    }
  }

  // Un reintento con los mismos datos recibe la recepción ya registrada; con otros datos, 409,
  // para que una corrección no se pierda sin aviso.
  private recepcionExistente(
    dto: RegistrarRecepcionDto,
    previa: { recepcion: InvRecepcionCompra; ingreso: InvMovimiento },
  ): ResultadoRecepcion {
    const firma = (lineas: LineaStock[]) =>
      lineas
        .map((l) => `${l.id_producto}-${l.id_bodega}-${l.cantidad}`)
        .sort()
        .join(',');
    if (
      previa.recepcion.id_proveedor !== dto.id_proveedor ||
      firma(previa.ingreso.detalles) !== firma(dto.lineas)
    ) {
      throw new ConflictException(
        `La guía ${dto.nro_guia_proveedor} de la OC ${dto.id_oc} ya se registró con otros datos`,
      );
    }
    return {
      id_oc: previa.recepcion.id_oc,
      id_proveedor: previa.recepcion.id_proveedor,
      nro_guia_proveedor: previa.recepcion.nro_guia_proveedor,
      ingreso: previa.ingreso,
    };
  }

  private async crearMovimiento(
    tipo_operacion: 'EGRESO' | 'LIBERACION',
    dto: RegistrarDespachoDto,
    lineas: LineaStock[],
    manager: EntityManager,
  ): Promise<InvMovimiento> {
    const movimiento = await this.movimientoRepo.crearCabecera(
      {
        id_empleado: dto.id_empleado,
        id_pedido: dto.id_pedido,
        tipo_operacion,
        estado: 'COMPLETADO',
      },
      manager,
    );
    movimiento.detalles = [];
    for (const linea of lineas) {
      movimiento.detalles.push(
        await this.movimientoRepo.crearDetalle(
          { ...linea, id_movimiento: movimiento.id_movimiento },
          manager,
        ),
      );
    }
    return movimiento;
  }

  private stockInconsistente(linea: LineaStock) {
    return new ConflictException(
      `El stock reservado del producto ${linea.id_producto} en la bodega ${linea.id_bodega} no coincide con la reserva`,
    );
  }

  async registrarAjuste(dto: RegistrarAjusteDto): Promise<InvMovimiento> {
    return this.dataSource.transaction(async (manager) => {
      const producto = await manager.findOneBy(InvProducto, {
        id_producto: dto.id_producto,
      });
      if (!producto || !producto.activo) {
        throw new NotFoundException('Producto Inválido');
      }

      const bodegaExiste = await manager.existsBy(InvBodegas, {
        id_bodega: dto.id_bodega,
      });
      if (!bodegaExiste) {
        throw new NotFoundException('Bodega inválida');
      }

      if (dto.cantidad > 0) {
        await this.stockRepo.sumarDisponible(
          dto.id_producto,
          dto.id_bodega,
          dto.cantidad,
          manager,
        );
      } else if (
        !(await this.stockRepo.restarDisponible(
          dto.id_producto,
          dto.id_bodega,
          -dto.cantidad,
          manager,
        ))
      ) {
        throw new ConflictException(
          'Stock insuficiente para realizar el ajuste negativo',
        );
      }

      const movimiento = await this.movimientoRepo.crearCabecera(
        {
          // TODO paso 8: sacarlo del token.
          id_empleado: dto.id_empleado,
          tipo_operacion: 'AJUSTE',
          estado: 'COMPLETADO',
        },
        manager,
      );

      const detalle = await this.movimientoRepo.crearDetalle(
        {
          id_movimiento: movimiento.id_movimiento,
          id_producto: dto.id_producto,
          id_bodega: dto.id_bodega,
          cantidad: dto.cantidad,
        },
        manager,
      );

      movimiento.detalles = [detalle];
      return movimiento;
    });
  }
}
