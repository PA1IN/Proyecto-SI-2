import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { StockRepository } from '../stock/repositories/stock.repository.js';
import { MovimientosService } from './movimientos.service.js';
import { InvMovimiento } from './entities/inv-movimiento.entity.js';
import { MovimientoRepository } from './repositories/movimiento.repository.js';
import { ReservaStrategy } from './strategies/reserva.strategy.js';

const dto = { id_empleado: 1, id_producto: 5, id_bodega: 2, cantidad: 50 };

function crearServicio(
  producto: object | null,
  bodegaExiste = true,
  alcanzaStock = true,
) {
  const manager = {
    findOneBy: vi.fn().mockResolvedValue(producto),
    existsBy: vi.fn().mockResolvedValue(bodegaExiste),
  };
  const dataSource = {
    transaction: (fn: (m: EntityManager) => unknown) =>
      fn(manager as unknown as EntityManager),
  } as unknown as DataSource;
  const stockRepo = {
    sumarDisponible: vi.fn(),
    restarDisponible: vi.fn().mockResolvedValue(alcanzaStock),
  };
  const movimientoRepo = {
    crearCabecera: vi.fn(async (datos) => ({ id_movimiento: 3, ...datos })),
    crearDetalle: vi.fn(async (datos) => ({ id_detalle: 7, ...datos })),
  };
  const service = new MovimientosService(
    dataSource,
    stockRepo as unknown as StockRepository,
    movimientoRepo as unknown as MovimientoRepository,
    {} as ReservaStrategy,
  );
  return { service, stockRepo, movimientoRepo };
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
      const { service, stockRepo, movimientoRepo } = crearServicio(
        producto,
        bodega,
      );

      await expect(service.registrarIngreso(dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(movimientoRepo.crearCabecera).not.toHaveBeenCalled();
      expect(stockRepo.sumarDisponible).not.toHaveBeenCalled();
    },
  );
});

describe('MovimientosService.registrarAjuste', () => {
  it('ajuste positivo: suma el stock y crea el movimiento AJUSTE', async () => {
    const { service, stockRepo } = crearServicio({ activo: true });

    const res = await service.registrarAjuste({ ...dto, cantidad: 4 });

    expect(res).toMatchObject({
      tipo_operacion: 'AJUSTE',
      estado: 'COMPLETADO',
    });
    expect(stockRepo.sumarDisponible).toHaveBeenCalledWith(
      5,
      2,
      4,
      expect.anything(),
    );
    expect(stockRepo.restarDisponible).not.toHaveBeenCalled();
  });

  it('ajuste negativo: resta con UPDATE condicional y guarda la cantidad negativa', async () => {
    const { service, stockRepo } = crearServicio({ activo: true });

    const res = await service.registrarAjuste({ ...dto, cantidad: -3 });

    expect(stockRepo.restarDisponible).toHaveBeenCalledWith(
      5,
      2,
      3,
      expect.anything(),
    );
    expect(stockRepo.sumarDisponible).not.toHaveBeenCalled();
    expect(res.detalles).toMatchObject([{ cantidad: -3 }]);
  });

  it('responde 409 si el stock no alcanza y no crea el movimiento', async () => {
    const { service, movimientoRepo } = crearServicio(
      { activo: true },
      true,
      false,
    );

    await expect(
      service.registrarAjuste({ ...dto, cantidad: -3 }),
    ).rejects.toThrow(ConflictException);
    expect(movimientoRepo.crearCabecera).not.toHaveBeenCalled();
  });
});
