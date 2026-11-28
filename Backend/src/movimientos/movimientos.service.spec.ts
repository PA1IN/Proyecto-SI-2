import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
import { StockRepository } from '../stock/repositories/stock.repository.js';
import { MovimientosService } from './movimientos.service.js';
import { InvMovimiento } from './entities/inv-movimiento.entity.js';
import { MovimientoRepository } from './repositories/movimiento.repository.js';
import { ReservaStrategy } from './strategies/reserva.strategy.js';
import { PostventaRepository } from './repositories/postventa.repository.js';

const dto = { id_producto: 5, id_bodega: 2, cantidad: 50 };
const idEmpleado = 1;

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
    {} as PostventaRepository
  );
  return { service, stockRepo, movimientoRepo };
}

describe('MovimientosService.registrarIngreso', () => {
  it('crea la cabecera INGRESO COMPLETADO, el detalle y suma el stock', async () => {
    const { service, stockRepo } = crearServicio({ activo: true });

    const res: InvMovimiento = await service.registrarIngreso(dto, idEmpleado);

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

      await expect(service.registrarIngreso(dto, idEmpleado)).rejects.toThrow(
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

    const res = await service.registrarAjuste(
      { ...dto, cantidad: 4 },
      idEmpleado,
    );

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

    const res = await service.registrarAjuste(
      { ...dto, cantidad: -3 },
      idEmpleado,
    );

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
      service.registrarAjuste({ ...dto, cantidad: -3 }, idEmpleado),
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
      {} as PostventaRepository,
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
      {} as PostventaRepository,
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

describe('MovimientosService.obtenerReservaPorPedido', () => {
  function crearServicioConsulta(reserva: object | null) {
    const movimientoRepo = {
      findPorPedido: vi.fn().mockResolvedValue(reserva),
      findById: vi.fn().mockResolvedValue({
        detalles: [
          {
            id_producto: 4,
            id_bodega: 3,
            cantidad: 2,
            producto: { sku: '75288-1', nombre_set: 'AT-AT' },
            bodega: { nombre_bodega: 'Norte', ubicacion_fisica: 'Antofagasta' },
          },
        ],
      }),
    };
    const service = new MovimientosService(
      {} as DataSource,
      {} as StockRepository,
      movimientoRepo as unknown as MovimientoRepository,
      {} as ReservaStrategy,
      {} as PostventaRepository,
    );
    return { service, movimientoRepo };
  }

  it('devuelve el estado y cada línea con su producto y bodega', async () => {
    const fecha = new Date('2026-11-16T12:00:00Z');
    const { service, movimientoRepo } = crearServicioConsulta({
      id_movimiento: 30,
      estado: 'PENDIENTE',
      fecha_registro: fecha,
    });

    await expect(service.obtenerReservaPorPedido(1001)).resolves.toEqual({
      id_pedido: 1001,
      id_movimiento: 30,
      estado: 'PENDIENTE',
      fecha_registro: fecha,
      lineas: [
        {
          id_producto: 4,
          sku: '75288-1',
          nombre_set: 'AT-AT',
          id_bodega: 3,
          nombre_bodega: 'Norte',
          ubicacion_fisica: 'Antofagasta',
          cantidad: 2,
        },
      ],
    });
    expect(movimientoRepo.findPorPedido).toHaveBeenCalledWith(1001, 'RESERVA');
  });

  it('responde 404 si el pedido no tiene reserva', async () => {
    const { service } = crearServicioConsulta(null);

    await expect(service.obtenerReservaPorPedido(1001)).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('MovimientosService.registrarDespacho', () => {
  const despachoDto = {
    id_despacho: 'GD-52341',
    id_pedido: 1001,
    id_empleado: 7,
    lineas: [
      { id_producto: 1, cantidad: 10 },
      { id_producto: 2, cantidad: 1 },
    ],
  };
  const reservaPendiente = () => ({
    id_movimiento: 30,
    id_pedido: 1001,
    estado: 'PENDIENTE',
    detalles: [
      { id_detalle: 1, id_producto: 1, id_bodega: 2, cantidad: 7 },
      { id_detalle: 2, id_producto: 1, id_bodega: 5, cantidad: 23 },
      { id_detalle: 3, id_producto: 2, id_bodega: 4, cantidad: 1 },
    ],
  });

  function crearServicioDespacho(
    reserva: object | null,
    opciones: { egresoPrevio?: object | null; stockOk?: boolean } = {},
  ) {
    const dataSource = {
      transaction: (fn: (m: EntityManager) => unknown) =>
        fn({} as EntityManager),
    } as unknown as DataSource;
    const stockRepo = {
      descontarReservado: vi.fn().mockResolvedValue(opciones.stockOk ?? true),
      liberarReservado: vi.fn().mockResolvedValue(true),
    };
    let siguienteId = 40;
    const movimientoRepo = {
      findReservaParaActualizar: vi.fn().mockResolvedValue(reserva),
      findEgresoPorDespacho: vi
        .fn()
        .mockResolvedValue(opciones.egresoPrevio ?? null),
      findPorPedido: vi.fn().mockResolvedValue(null),
      crearCabecera: vi.fn(async (datos) => ({
        id_movimiento: siguienteId++,
        ...datos,
      })),
      crearDetalle: vi.fn(async (datos) => ({ id_detalle: 9, ...datos })),
      crearDespacho: vi.fn(),
      actualizarEstado: vi.fn(),
    };
    const service = new MovimientosService(
      dataSource,
      stockRepo as unknown as StockRepository,
      movimientoRepo as unknown as MovimientoRepository,
      {} as ReservaStrategy,
      {} as PostventaRepository,
    );
    return { service, stockRepo, movimientoRepo };
  }

  it('despacho parcial: EGRESO de lo recolectado, LIBERACION del resto y reserva COMPLETADO', async () => {
    const { service, stockRepo, movimientoRepo } =
      crearServicioDespacho(reservaPendiente());

    const res = await service.registrarDespacho(despachoDto);

    expect(
      stockRepo.descontarReservado.mock.calls.map((c) => c.slice(0, 3)),
    ).toEqual([
      [1, 2, 7],
      [1, 5, 3],
      [2, 4, 1],
    ]);
    expect(
      stockRepo.liberarReservado.mock.calls.map((c) => c.slice(0, 3)),
    ).toEqual([[1, 5, 20]]);
    expect(res.egreso).toMatchObject({
      id_movimiento: 40,
      tipo_operacion: 'EGRESO',
      id_empleado: 7,
      id_pedido: 1001,
    });
    expect(res.liberacion).toMatchObject({
      tipo_operacion: 'LIBERACION',
      detalles: [{ id_producto: 1, id_bodega: 5, cantidad: 20 }],
    });
    expect(movimientoRepo.crearDespacho).toHaveBeenCalledWith(
      {
        id_movimiento: 40,
        id_despacho: 'GD-52341',
        observaciones_picking: null,
      },
      expect.anything(),
    );
    expect(movimientoRepo.actualizarEstado).toHaveBeenCalledWith(
      30,
      'COMPLETADO',
      expect.anything(),
    );
  });

  it('despacho completo: sin LIBERACION', async () => {
    const { service, stockRepo } = crearServicioDespacho(reservaPendiente());

    const res = await service.registrarDespacho({
      ...despachoDto,
      lineas: [
        { id_producto: 1, cantidad: 30 },
        { id_producto: 2, cantidad: 1 },
      ],
    });

    expect(res.liberacion).toBeNull();
    expect(stockRepo.liberarReservado).not.toHaveBeenCalled();
  });

  it('si la guía ya se registró para el pedido, la devuelve sin tocar el stock', async () => {
    const previo = { id_movimiento: 41, id_pedido: 1001 };
    const { service, stockRepo, movimientoRepo } = crearServicioDespacho(
      { ...reservaPendiente(), estado: 'COMPLETADO' },
      { egresoPrevio: previo },
    );

    const res = await service.registrarDespacho(despachoDto);

    expect(res.egreso).toBe(previo);
    expect(stockRepo.descontarReservado).not.toHaveBeenCalled();
    expect(movimientoRepo.crearCabecera).not.toHaveBeenCalled();
  });

  it.each([
    [
      'la guía ya se usó en otro pedido',
      { egresoPrevio: { id_pedido: 999 } },
      'PENDIENTE',
    ],
    ['la reserva ya se despachó con otra guía', {}, 'COMPLETADO'],
    ['la reserva se anuló', {}, 'ANULADO'],
    ['el stock reservado no coincide', { stockOk: false }, 'PENDIENTE'],
  ])('responde 409 si %s', async (_caso, opciones, estado) => {
    const { service, movimientoRepo } = crearServicioDespacho(
      { ...reservaPendiente(), estado },
      opciones,
    );

    await expect(service.registrarDespacho(despachoDto)).rejects.toThrow(
      ConflictException,
    );
    expect(movimientoRepo.actualizarEstado).not.toHaveBeenCalled();
  });

  it('responde 404 si el pedido no tiene reserva', async () => {
    const { service } = crearServicioDespacho(null);

    await expect(service.registrarDespacho(despachoDto)).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('MovimientosService.registrarRecepcion', () => {
  const recepcionDto = {
    id_oc: 55,
    id_proveedor: 3,
    nro_guia_proveedor: 'GP-8812',
    id_empleado: 4,
    lineas: [
      { id_producto: 1, id_bodega: 2, cantidad: 18 },
      { id_producto: 2, id_bodega: 2, cantidad: 5 },
    ],
  };

  function crearServicioRecepcion(
    opciones: {
      previa?: object | null;
      productos?: object[];
      bodegas?: object[];
      transaccion?: () => never;
    } = {},
  ) {
    const manager = {
      findBy: vi.fn(async (entidad: { name: string }) =>
        entidad.name === 'InvProducto'
          ? (opciones.productos ?? [
              { id_producto: 1, activo: true },
              { id_producto: 2, activo: true },
            ])
          : (opciones.bodegas ?? [{ id_bodega: 2 }]),
      ),
    };
    const dataSource = {
      manager,
      transaction: opciones.transaccion
        ? vi.fn(opciones.transaccion)
        : vi.fn((fn: (m: EntityManager) => unknown) =>
            fn(manager as unknown as EntityManager),
          ),
    } as unknown as DataSource;
    const stockRepo = { sumarDisponible: vi.fn() };
    const movimientoRepo = {
      findRecepcion: vi.fn().mockResolvedValue(opciones.previa ?? null),
      crearCabecera: vi.fn(async (datos) => ({ id_movimiento: 50, ...datos })),
      crearRecepcion: vi.fn(),
      crearDetalle: vi.fn(async (datos) => ({ id_detalle: 1, ...datos })),
    };
    const service = new MovimientosService(
      dataSource,
      stockRepo as unknown as StockRepository,
      movimientoRepo as unknown as MovimientoRepository,
      {} as ReservaStrategy,
      {} as PostventaRepository,
    );
    return { service, stockRepo, movimientoRepo };
  }

  // La recepción ya registrada, con las mismas líneas en otro orden.
  const previaIgual = () => ({
    recepcion: { id_oc: 55, id_proveedor: 3, nro_guia_proveedor: 'GP-8812' },
    ingreso: {
      id_movimiento: 49,
      detalles: [
        { id_producto: 2, id_bodega: 2, cantidad: 5 },
        { id_producto: 1, id_bodega: 2, cantidad: 18 },
      ],
    },
  });

  it('crea el INGRESO, la fila de recepción y suma el stock de cada línea', async () => {
    const { service, stockRepo, movimientoRepo } = crearServicioRecepcion();

    const res = await service.registrarRecepcion(recepcionDto);

    expect(movimientoRepo.crearCabecera).toHaveBeenCalledWith(
      { id_empleado: 4, tipo_operacion: 'INGRESO', estado: 'COMPLETADO' },
      expect.anything(),
    );
    expect(movimientoRepo.crearRecepcion).toHaveBeenCalledWith(
      {
        id_movimiento: 50,
        id_oc: 55,
        id_proveedor: 3,
        nro_guia_proveedor: 'GP-8812',
      },
      expect.anything(),
    );
    expect(
      stockRepo.sumarDisponible.mock.calls.map((c) => c.slice(0, 3)),
    ).toEqual([
      [1, 2, 18],
      [2, 2, 5],
    ]);
    expect(res.ingreso.detalles).toHaveLength(2);
  });

  it('un reintento con los mismos datos devuelve la recepción ya registrada', async () => {
    const previa = previaIgual();
    const { service, stockRepo } = crearServicioRecepcion({ previa });

    const res = await service.registrarRecepcion(recepcionDto);

    expect(res.ingreso).toBe(previa.ingreso);
    expect(stockRepo.sumarDisponible).not.toHaveBeenCalled();
  });

  it.each([
    [
      'otras cantidades',
      {
        lineas: [
          { id_producto: 1, id_bodega: 2, cantidad: 17 },
          { id_producto: 2, id_bodega: 2, cantidad: 5 },
        ],
      },
    ],
    ['otro proveedor', { id_proveedor: 9 }],
  ])('responde 409 si la misma guía llega con %s', async (_caso, cambio) => {
    const { service, stockRepo } = crearServicioRecepcion({
      previa: previaIgual(),
    });

    await expect(
      service.registrarRecepcion({ ...recepcionDto, ...cambio }),
    ).rejects.toThrow(ConflictException);
    expect(stockRepo.sumarDisponible).not.toHaveBeenCalled();
  });

  it.each([
    [
      'un producto no existe',
      { productos: [{ id_producto: 1, activo: true }] },
    ],
    ['la bodega no existe', { bodegas: [] }],
  ])('responde 404 si %s y no crea nada', async (_caso, opciones) => {
    const { service, movimientoRepo } = crearServicioRecepcion(opciones);

    await expect(service.registrarRecepcion(recepcionDto)).rejects.toThrow(
      NotFoundException,
    );
    expect(movimientoRepo.crearCabecera).not.toHaveBeenCalled();
  });

  it('si choca con el UNIQUE por un reintento simultáneo, devuelve la recepción ganadora', async () => {
    const previa = previaIgual();
    const choque = new QueryFailedError('INSERT', [], {
      code: '23505',
      constraint: 'uq_recepcion_oc_guia',
    } as unknown as Error);
    const { service, movimientoRepo } = crearServicioRecepcion({
      transaccion: () => {
        throw choque;
      },
    });
    movimientoRepo.findRecepcion.mockResolvedValueOnce(previa);

    await expect(
      service.registrarRecepcion(recepcionDto),
    ).resolves.toMatchObject({
      ingreso: previa.ingreso,
    });
  });
});

describe('MovimientosService.obtenerDevolucionPorId', () => {
  const devolucionBase = {
    id_devolucion: 1,
    id_reclamo: 10,
    id_pedido: 1001,
    id_producto: 5,
    sku: '60434-1',
    nombre_set: 'Space Base and Rocket Launchpad',
    cantidad: 2,
    estado_reclamo: 'APROBADO',
  };

  function crearServicioDevolucion(
    devolucion: object | null,
    movimientoExistente: object | null = null,
  ) {
    const movimientoRepo = {
      findPorDevolucion: vi.fn().mockResolvedValue(movimientoExistente),
    };
    const postventaRepo = {
      findDevolucionPorId: vi.fn().mockResolvedValue(devolucion),
    };
    const service = new MovimientosService(
      {} as DataSource,
      {} as StockRepository,
      movimientoRepo as unknown as MovimientoRepository,
      {} as ReservaStrategy,
      postventaRepo as unknown as PostventaRepository,
    );
    return { service, movimientoRepo, postventaRepo };
  }

  it('devuelve los datos de la devolución cuando existe y aún no fue recibida', async () => {
    const { service, postventaRepo, movimientoRepo } =
      crearServicioDevolucion(devolucionBase);

    await expect(service.obtenerDevolucionPorId(1)).resolves.toEqual({
      id_devolucion: 1,
      id_pedido: 1001,
      producto: {
        id_producto: 5,
        sku: '60434-1',
        nombre_set: 'Space Base and Rocket Launchpad',
      },
      cantidad: 2,
      estado: 'APROBADO',
      recibida: false,
      id_movimiento: null,
    });
    expect(postventaRepo.findDevolucionPorId).toHaveBeenCalledWith(1);
    expect(movimientoRepo.findPorDevolucion).toHaveBeenCalledWith(1);
  });

  it('responde 404 si la devolución no existe en Postventa', async () => {
    const { service, movimientoRepo } = crearServicioDevolucion(null);

    await expect(service.obtenerDevolucionPorId(999)).rejects.toThrow(
      NotFoundException,
    );
    expect(movimientoRepo.findPorDevolucion).not.toHaveBeenCalled();
  });

  it('indica recibida = true y el id_movimiento si ya fue recepcionada', async () => {
    const { service } = crearServicioDevolucion(devolucionBase, {
      id_movimiento: 88,
    });

    await expect(service.obtenerDevolucionPorId(1)).resolves.toMatchObject({
      id_devolucion: 1,
      recibida: true,
      id_movimiento: 88,
    });
  });
});
