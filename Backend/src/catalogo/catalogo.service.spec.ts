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
