import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
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

describe('MovimientosService.registrarReserva', () => {
  const reservaDto = {
    id_pedido: 1001,
    lineas: [
      { id_producto: 9, cantidad: 3 },
      { id_producto: 4, cantidad: 2 },
    ],
  };

  function crearServicioReserva(opciones: {
    productos?: object[];
    existente?: object | null;
    transaccion?: () => never;
  }) {
    const productos = opciones.productos ?? [
      { id_producto: 4, activo: true },
      { id_producto: 9, activo: true },
    ];
    const manager = { findBy: vi.fn().mockResolvedValue(productos) };
    const dataSource = {
      transaction: opciones.transaccion
        ? vi.fn(opciones.transaccion)
        : vi.fn((fn: (m: EntityManager) => unknown) =>
            fn(manager as unknown as EntityManager),
          ),
    } as unknown as DataSource;
    const movimientoRepo = {
      findPorPedido: vi.fn().mockResolvedValue(opciones.existente ?? null),
      crearCabecera: vi.fn(async (datos) => ({ id_movimiento: 30, ...datos })),
      crearDetalle: vi.fn(async (datos) => ({ id_detalle: 1, ...datos })),
    };
    // El producto 9 se reparte entre dos bodegas; el 4 sale de una sola.
    const reservaStrategy = {
      ejecutar: vi.fn(async ({ idProducto }) =>
        idProducto === 9
          ? [
              { id_bodega: 2, cantidad_asignada: 2 },
              { id_bodega: 1, cantidad_asignada: 1 },
            ]
          : [{ id_bodega: 3, cantidad_asignada: 2 }],
      ),
    };
    const service = new MovimientosService(
      dataSource,
      {} as StockRepository,
      movimientoRepo as unknown as MovimientoRepository,
      reservaStrategy as unknown as ReservaStrategy,
    );
    return { service, dataSource, movimientoRepo, reservaStrategy };
  }

  it('crea una RESERVA PENDIENTE sin empleado, con un detalle por bodega', async () => {
    const { service, movimientoRepo, reservaStrategy } = crearServicioReserva(
      {},
    );

    const res = await service.registrarReserva(reservaDto);

    expect(movimientoRepo.crearCabecera).toHaveBeenCalledWith(
      {
        id_empleado: null,
        id_pedido: 1001,
        tipo_operacion: 'RESERVA',
        estado: 'PENDIENTE',
      },
      expect.anything(),
    );
    // Las líneas se procesan ordenadas por id_producto (4 antes que 9).
    expect(
      reservaStrategy.ejecutar.mock.calls.map(([c]) => c.idProducto),
    ).toEqual([4, 9]);
    expect(res.detalles).toMatchObject([
      { id_producto: 4, id_bodega: 3, cantidad: 2 },
      { id_producto: 9, id_bodega: 2, cantidad: 2 },
      { id_producto: 9, id_bodega: 1, cantidad: 1 },
    ]);
  });

  it('si el pedido ya tiene reserva, la devuelve sin reservar de nuevo', async () => {
    const existente = { id_movimiento: 12, id_pedido: 1001, detalles: [] };
    const { service, dataSource, reservaStrategy } = crearServicioReserva({
      existente,
    });

    await expect(service.registrarReserva(reservaDto)).resolves.toBe(existente);
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(reservaStrategy.ejecutar).not.toHaveBeenCalled();
  });

  it('responde 409 si el pedido ya fue cancelado', async () => {
    const { service, dataSource } = crearServicioReserva({
      existente: { id_movimiento: 12, id_pedido: 1001, estado: 'ANULADO' },
    });

    await expect(service.registrarReserva(reservaDto)).rejects.toThrow(
      ConflictException,
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it.each([
    ['no existe', [{ id_producto: 4, activo: true }]],
    [
      'está inactivo',
      [
        { id_producto: 4, activo: true },
        { id_producto: 9, activo: false },
      ],
    ],
  ])(
    'responde 404 si un producto %s y no crea nada',
    async (_caso, productos) => {
      const { service, movimientoRepo } = crearServicioReserva({ productos });

      await expect(service.registrarReserva(reservaDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(movimientoRepo.crearCabecera).not.toHaveBeenCalled();
    },
  );

  it('si choca con el índice único por un reintento simultáneo, devuelve la reserva ganadora', async () => {
    const ganadora = { id_movimiento: 13, id_pedido: 1001, detalles: [] };
    const choque = new QueryFailedError('INSERT', [], {
      code: '23505',
      constraint: 'uq_reserva_por_pedido',
    } as unknown as Error);
    const { service, movimientoRepo } = crearServicioReserva({
      transaccion: () => {
        throw choque;
      },
    });
    movimientoRepo.findPorPedido
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(ganadora);

    await expect(service.registrarReserva(reservaDto)).resolves.toBe(ganadora);
  });

  it('propaga el 409 de stock insuficiente', async () => {
    const { service, reservaStrategy } = crearServicioReserva({});
    reservaStrategy.ejecutar.mockRejectedValueOnce(
      new ConflictException('Stock insuficiente para el producto 4'),
    );

    await expect(service.registrarReserva(reservaDto)).rejects.toThrow(
      ConflictException,
    );
  });
});

describe('MovimientosService.liberarReserva', () => {
  const detallesReserva = [
    { id_producto: 4, id_bodega: 3, cantidad: 2 },
    { id_producto: 9, id_bodega: 1, cantidad: 1 },
  ];

  function crearServicioLiberacion(
    reserva: object | null,
    opciones: { alcanza?: boolean; liberacionPrevia?: object | null } = {},
  ) {
    const dataSource = {
      transaction: (fn: (m: EntityManager) => unknown) =>
        fn({} as EntityManager),
    } as unknown as DataSource;
    const stockRepo = {
      liberarReservado: vi.fn().mockResolvedValue(opciones.alcanza ?? true),
    };
    const movimientoRepo = {
      findReservaParaActualizar: vi.fn().mockResolvedValue(reserva),
      findPorPedido: vi
        .fn()
        .mockResolvedValue(opciones.liberacionPrevia ?? null),
      crearCabecera: vi.fn(async (datos) => ({ id_movimiento: 40, ...datos })),
      crearDetalle: vi.fn(async (datos) => ({ id_detalle: 1, ...datos })),
      actualizarEstado: vi.fn(),
    };
    const service = new MovimientosService(
      dataSource,
      stockRepo as unknown as StockRepository,
      movimientoRepo as unknown as MovimientoRepository,
      {} as ReservaStrategy,
    );
    return { service, stockRepo, movimientoRepo };
  }

  const pendiente = () => ({
    id_movimiento: 30,
    estado: 'PENDIENTE',
    detalles: detallesReserva,
  });

  it('devuelve lo reservado, crea la LIBERACION y anula la reserva', async () => {
    const { service, stockRepo, movimientoRepo } =
      crearServicioLiberacion(pendiente());

    const res = await service.liberarReserva({ id_pedido: 1001 });

    expect(
      stockRepo.liberarReservado.mock.calls.map((c) => c.slice(0, 3)),
    ).toEqual([
      [4, 3, 2],
      [9, 1, 1],
    ]);
    expect(res).toMatchObject({
      id_empleado: null,
      id_pedido: 1001,
      tipo_operacion: 'LIBERACION',
      estado: 'COMPLETADO',
      detalles: detallesReserva,
    });
    expect(movimientoRepo.actualizarEstado).toHaveBeenCalledWith(
      30,
      'ANULADO',
      expect.anything(),
    );
  });

  it('responde 404 si el pedido no tiene reserva', async () => {
    const { service } = crearServicioLiberacion(null);

    await expect(service.liberarReserva({ id_pedido: 1001 })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('responde 409 si la reserva ya se despachó', async () => {
    const { service, stockRepo } = crearServicioLiberacion({
      ...pendiente(),
      estado: 'COMPLETADO',
    });

    await expect(service.liberarReserva({ id_pedido: 1001 })).rejects.toThrow(
      ConflictException,
    );
    expect(stockRepo.liberarReservado).not.toHaveBeenCalled();
  });

  it('si ya estaba anulada, devuelve la liberación existente sin tocar el stock', async () => {
    const previa = { id_movimiento: 41, tipo_operacion: 'LIBERACION' };
    const { service, stockRepo, movimientoRepo } = crearServicioLiberacion(
      { ...pendiente(), estado: 'ANULADO' },
      { liberacionPrevia: previa },
    );

    await expect(service.liberarReserva({ id_pedido: 1001 })).resolves.toBe(
      previa,
    );
    expect(stockRepo.liberarReservado).not.toHaveBeenCalled();
    expect(movimientoRepo.crearCabecera).not.toHaveBeenCalled();
  });

  it('responde 409 si el stock reservado no coincide y no anula la reserva', async () => {
    const { service, movimientoRepo } = crearServicioLiberacion(pendiente(), {
      alcanza: false,
    });

    await expect(service.liberarReserva({ id_pedido: 1001 })).rejects.toThrow(
      ConflictException,
    );
    expect(movimientoRepo.actualizarEstado).not.toHaveBeenCalled();
  });
});
