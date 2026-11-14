import { describe, expect, it } from 'vitest';
import { calcularAsignacionReserva } from './greedy-allocation.util.js';

const bodega = (id_bodega: number, cantidad_disponible: number) => ({
  id_bodega,
  cantidad_disponible,
});

describe('calcularAsignacionReserva', () => {
  it('si una bodega alcanza, toma todo de la que tiene más stock', () => {
    const bodegas = [bodega(1, 5), bodega(2, 20), bodega(3, 8)];

    expect(calcularAsignacionReserva(bodegas, 6)).toEqual([
      { id_bodega: 2, cantidad_asignada: 6 },
    ]);
  });

  it('si no alcanza una, completa con la siguiente de más stock', () => {
    const bodegas = [bodega(1, 3), bodega(2, 10), bodega(3, 7)];

    expect(calcularAsignacionReserva(bodegas, 15)).toEqual([
      { id_bodega: 2, cantidad_asignada: 10 },
      { id_bodega: 3, cantidad_asignada: 5 },
    ]);
  });

  it('con empate de stock, parte por el id_bodega menor', () => {
    const bodegas = [bodega(4, 10), bodega(2, 10)];

    expect(calcularAsignacionReserva(bodegas, 12)).toEqual([
      { id_bodega: 2, cantidad_asignada: 10 },
      { id_bodega: 4, cantidad_asignada: 2 },
    ]);
  });

  it('usa el stock exacto de todas las bodegas si hace falta', () => {
    const bodegas = [bodega(1, 4), bodega(2, 6)];

    expect(calcularAsignacionReserva(bodegas, 10)).toEqual([
      { id_bodega: 2, cantidad_asignada: 6 },
      { id_bodega: 1, cantidad_asignada: 4 },
    ]);
  });

  it('ignora las bodegas sin stock', () => {
    const bodegas = [bodega(1, 0), bodega(2, 3)];

    expect(calcularAsignacionReserva(bodegas, 3)).toEqual([
      { id_bodega: 2, cantidad_asignada: 3 },
    ]);
  });

  it.each([
    ['el stock total no alcanza', [bodega(1, 4), bodega(2, 5)], 10],
    ['no hay bodegas', [], 1],
    ['todas las bodegas están en 0', [bodega(1, 0), bodega(2, 0)], 1],
  ])('devuelve null si %s', (_caso, bodegas, cantidad) => {
    expect(calcularAsignacionReserva(bodegas, cantidad)).toBeNull();
  });

  it('no modifica el arreglo recibido', () => {
    const bodegas = [bodega(1, 3), bodega(2, 10)];
    const copia = structuredClone(bodegas);

    calcularAsignacionReserva(bodegas, 5);

    expect(bodegas).toEqual(copia);
  });
});
