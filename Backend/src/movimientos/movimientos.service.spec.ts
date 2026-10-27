import { NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { StockRepository } from '../stock/repositories/stock.repository.js';
import { MovimientosService } from './movimientos.service.js';
import { InvMovimiento } from './entities/inv-movimiento.entity.js';

const dto = { id_empleado: 1, id_producto: 5, id_bodega: 2, cantidad: 50 };

function crearServicio(producto: object | null, bodegaExiste = true) {
  const manager = {
    findOneBy: vi.fn().mockResolvedValue(producto),
    existsBy: vi.fn().mockResolvedValue(bodegaExiste),
    create: vi.fn((_entidad, datos) => ({ ...datos })),
    save: vi.fn(async (datos) =>
      'cantidad' in datos
        ? { id_detalle: 7, ...datos }
        : { id_movimiento: 3, ...datos },
    ),
  };
  const dataSource = {
    transaction: (fn: (m: EntityManager) => unknown) =>
      fn(manager as unknown as EntityManager),
  } as unknown as DataSource;
  const stockRepo = { sumarDisponible: vi.fn() };
  const service = new MovimientosService(
    dataSource,
    stockRepo as unknown as StockRepository,
  );
  return { service, manager, stockRepo };
}

describe('MovimientosService.registrarIngreso', () => {
  it('crea la cabecera INGRESO COMPLETADO, el detalle y suma el stock', async () => {
    const { service, stockRepo } = crearServicio({ activo: true });

    const res: InvMovimiento = await service.registrarIngreso(dto);

    expect(res).toMatchObject({
      id_movimiento: 3,
      id_empleado: 1,
      tipo_operacion: 'INGRESO',
      estado: 'COMPLETADO',
      detalles: [
        {
          id_detalle: 7,
          id_movimiento: 3,
          id_producto: 5,
          id_bodega: 2,
          cantidad: 50,
        },
      ],
    });
    expect(stockRepo.sumarDisponible).toHaveBeenCalledWith(
      5,
      2,
      50,
      expect.anything(),
    );
  });

  it.each([
    ['el producto no existe', null, true],
    ['el producto está inactivo', { activo: false }, true],
    ['la bodega no existe', { activo: true }, false],
  ])(
    'responde 404 si %s y no escribe nada',
    async (_caso, producto, bodega) => {
      const { service, manager, stockRepo } = crearServicio(producto, bodega);

      await expect(service.registrarIngreso(dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(manager.save).not.toHaveBeenCalled();
      expect(stockRepo.sumarDisponible).not.toHaveBeenCalled();
    },
  );
});
