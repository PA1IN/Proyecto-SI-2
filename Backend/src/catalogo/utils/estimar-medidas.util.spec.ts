import { describe, expect, it } from 'vitest';
import { estimarMedidas } from './estimar-medidas.util.js';

describe('estimarMedidas', () => {
  it.each([
    // [piezas, largo, ancho, alto] en los bordes de cada rango.
    [1, 26, 19, 6],
    [300, 26, 19, 6],
    [301, 38, 26, 7],
    [1000, 38, 26, 7],
    [1001, 48, 38, 9],
    [2500, 48, 38, 9],
    [2501, 58, 48, 12],
    [5000, 58, 48, 12],
    [5001, 70, 50, 17],
    [9090, 70, 50, 17],
  ])(
    '%i piezas va en una caja de %i × %i × %i',
    (piezas, largo, ancho, alto) => {
      expect(estimarMedidas(piezas)).toMatchObject({
        largo_cm: largo,
        ancho_cm: ancho,
        alto_cm: alto,
      });
    },
  );

  it.each([
    [0, 0.2],
    [1267, 1.59],
    [2049, 2.45],
    [5685, 6.45],
    // x,xx5 exacto: redondea hacia arriba, igual que round() de Postgres.
    [150, 0.37],
    [250, 0.48],
  ])('%i piezas pesan %f kg', (piezas, peso) => {
    expect(estimarMedidas(piezas).peso_unitario_kg).toBe(peso);
  });
});
