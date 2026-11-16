import { BadRequestException } from '@nestjs/common';

export interface LineaStock {
  id_producto: number;
  id_bodega: number;
  cantidad: number;
}

export interface RepartoDespacho {
  egreso: LineaStock[];
  liberacion: LineaStock[];
}

// Reparte lo recolectado contra lo reservado (acordado con Logística el 16-11-2026):
// - lineas trae TODOS los productos de la reserva (cantidad 0 = no se recolectó); si falta o
//   sobra un producto, o se recolecta más de lo reservado, responde 400.
// - Por producto, lo recolectado sale de las bodegas en el orden de la reserva; el resto se libera.
export function repartirDespacho(
  reservado: LineaStock[],
  recolectado: { id_producto: number; cantidad: number }[],
): RepartoDespacho {
  const porProducto = new Map<number, LineaStock[]>();
  for (const linea of reservado) {
    porProducto.set(linea.id_producto, [
      ...(porProducto.get(linea.id_producto) ?? []),
      linea,
    ]);
  }

  const faltan = [...porProducto.keys()].filter(
    (id) => !recolectado.some((l) => l.id_producto === id),
  );
  if (faltan.length) {
    throw new BadRequestException(
      `Faltan productos de la reserva en lineas (con cantidad 0 si no se recolectaron): ${faltan.join(', ')}`,
    );
  }

  const reparto: RepartoDespacho = { egreso: [], liberacion: [] };
  for (const { id_producto, cantidad } of recolectado) {
    const bodegas = porProducto.get(id_producto);
    if (!bodegas) {
      throw new BadRequestException(
        `El producto ${id_producto} no está en la reserva del pedido`,
      );
    }
    const totalReservado = bodegas.reduce((s, b) => s + b.cantidad, 0);
    if (cantidad > totalReservado) {
      throw new BadRequestException(
        `Del producto ${id_producto} se reservaron ${totalReservado} y se informan ${cantidad} recolectados`,
      );
    }

    let porSacar = cantidad;
    for (const bodega of bodegas) {
      const sale = Math.min(porSacar, bodega.cantidad);
      porSacar -= sale;
      if (sale > 0) reparto.egreso.push({ ...bodega, cantidad: sale });
      if (bodega.cantidad - sale > 0) {
        reparto.liberacion.push({
          ...bodega,
          cantidad: bodega.cantidad - sale,
        });
      }
    }
  }

  if (reparto.egreso.length === 0) {
    throw new BadRequestException(
      'El despacho no tiene ninguna unidad recolectada',
    );
  }
  return reparto;
}
