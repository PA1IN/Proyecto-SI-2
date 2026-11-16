export interface MedidasProducto {
  peso_unitario_kg: number;
  largo_cm: number;
  ancho_cm: number;
  alto_cm: number;
}

// [máximo de piezas, largo, ancho, alto] de cajas típicas de LEGO, en cm.
const RANGOS: [number, number, number, number][] = [
  [300, 26, 19, 6],
  [1000, 38, 26, 7],
  [2500, 48, 38, 9],
  [5000, 58, 48, 12],
  [Infinity, 70, 50, 17],
];

// Estimación acordada con Logística (16-11-2026) para productos sin peso ni medidas reales.
// Es la misma fórmula de db/dml/06_medidas_productos.sql: si cambia una, cambiar la otra.
export function estimarMedidas(cantPiezas: number): MedidasProducto {
  const [, largo_cm, ancho_cm, alto_cm] = RANGOS.find(
    ([maximo]) => cantPiezas <= maximo,
  )!;
  return {
    // 0,20 kg de caja y manuales + 1,1 g por pieza. Se calcula en enteros para redondear
    // igual que round() de Postgres (sin errores de punto flotante).
    peso_unitario_kg: Math.round((2000 + 11 * cantPiezas) / 100) / 100,
    largo_cm,
    ancho_cm,
    alto_cm,
  };
}
