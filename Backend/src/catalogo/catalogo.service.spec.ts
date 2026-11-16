import { NotFoundException } from '@nestjs/common';
import { CatalogoService } from './catalogo.service.js';
import { ProductoRepository } from './repositories/producto.repository.js';
import { TemaRepository } from './repositories/tema.repository.js';

function crearServicio(filas: object[]) {
  const productoRepo = { findConStock: vi.fn().mockResolvedValue(filas) };
  const service = new CatalogoService(
    productoRepo as unknown as ProductoRepository,
    {} as TemaRepository,
  );
  return { service, productoRepo };
}

describe('CatalogoService.obtenerProducto', () => {
  it('devuelve el producto con su stock', async () => {
    const producto = { id_producto: 5, cantidad_disponible: 12 };
    const { service, productoRepo } = crearServicio([producto]);

    await expect(service.obtenerProducto(5)).resolves.toBe(producto);
    expect(productoRepo.findConStock).toHaveBeenCalledWith(5);
  });

  it('responde 404 si el producto no existe', async () => {
    const { service } = crearServicio([]);

    await expect(service.obtenerProducto(999)).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('CatalogoService.crearProducto', () => {
  const base = {
    id_tema: 1,
    sku: '75288-1',
    nombre_set: 'AT-AT',
    cant_piezas: 1267,
  };

  function crearServicioCreacion() {
    const productoRepo = {
      findBySku: vi.fn().mockResolvedValue(null),
      crear: vi.fn(async (datos) => ({ id_producto: 130, ...datos })),
    };
    const temaRepo = { findById: vi.fn().mockResolvedValue({ id_tema: 1 }) };
    const service = new CatalogoService(
      productoRepo as unknown as ProductoRepository,
      temaRepo as unknown as TemaRepository,
    );
    return { service, productoRepo };
  }

  it('sin medidas, las estima por cantidad de piezas', async () => {
    const { service, productoRepo } = crearServicioCreacion();

    await service.crearProducto(base);

    expect(productoRepo.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        peso_unitario_kg: 1.59,
        largo_cm: 48,
        ancho_cm: 38,
        alto_cm: 9,
      }),
    );
  });

  it('respeta las medidas que vienen y estima solo las que faltan', async () => {
    const { service, productoRepo } = crearServicioCreacion();

    await service.crearProducto({
      ...base,
      peso_unitario_kg: 2.1,
      largo_cm: 48,
      alto_cm: 37.8,
    });

    expect(productoRepo.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        peso_unitario_kg: 2.1,
        largo_cm: 48,
        alto_cm: 37.8,
        ancho_cm: 38,
      }),
    );
  });
});
