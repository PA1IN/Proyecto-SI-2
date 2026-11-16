import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { repartirDespacho } from './repartir-despacho.util.js';

// El producto 1 quedó reservado en dos bodegas (7 en la 2 y 23 en la 5); el 2, en una.
const reservado = [
  { id_producto: 1, id_bodega: 2, cantidad: 7 },
  { id_producto: 1, id_bodega: 5, cantidad: 23 },
  { id_producto: 2, id_bodega: 4, cantidad: 1 },
];

describe('repartirDespacho', () => {
  it('despacho completo: todo sale y no se libera nada', () => {
    expect(
      repartirDespacho(reservado, [
        { id_producto: 1, cantidad: 30 },
        { id_producto: 2, cantidad: 1 },
      ]),
    ).toEqual({ egreso: reservado, liberacion: [] });
  });

  it('despacho parcial: sale en el orden de la reserva y el resto se libera', () => {
    expect(
      repartirDespacho(reservado, [
        { id_producto: 1, cantidad: 10 },
        { id_producto: 2, cantidad: 0 },
      ]),
    ).toEqual({
      egreso: [
        { id_producto: 1, id_bodega: 2, cantidad: 7 },
        { id_producto: 1, id_bodega: 5, cantidad: 3 },
      ],
      liberacion: [
        { id_producto: 1, id_bodega: 5, cantidad: 20 },
        { id_producto: 2, id_bodega: 4, cantidad: 1 },
      ],
    });
  });

  it.each([
    ['falta un producto de la reserva', [{ id_producto: 1, cantidad: 30 }]],
    [
      'viene un producto que no está reservado',
      [
        { id_producto: 1, cantidad: 30 },
        { id_producto: 2, cantidad: 1 },
        { id_producto: 9, cantidad: 1 },
      ],
    ],
    [
      'se recolecta más de lo reservado',
      [
        { id_producto: 1, cantidad: 31 },
        { id_producto: 2, cantidad: 1 },
      ],
    ],
    [
      'no se recolectó nada',
      [
        { id_producto: 1, cantidad: 0 },
        { id_producto: 2, cantidad: 0 },
      ],
    ],
  ])('responde 400 si %s', (_caso, recolectado) => {
    expect(() => repartirDespacho(reservado, recolectado)).toThrow(
      BadRequestException,
    );
  });
});
