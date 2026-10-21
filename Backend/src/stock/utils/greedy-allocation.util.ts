
export interface BodegaDisponible {
  id_bodega: number;
  cantidad_disponible: number;
}

export function calcularAsignacionReserva(
  bodegas: BodegaDisponible[],
  cantidadSolicitada: number,
): { id_bodega: number; cantidad_asignada: number }[] | null {
  const ordenadas = [...bodegas]
    .filter((b) => b.cantidad_disponible > 0)
    .sort((a, b) => b.cantidad_disponible !== a.cantidad_disponible 
      ? b.cantidad_disponible - a.cantidad_disponible 
      : a.id_bodega - b.id_bodega);

  let restante = cantidadSolicitada;
  const asignaciones = [];

  for (const bodega of ordenadas) {
    if (restante === 0) break;
    const aTomar = Math.min(bodega.cantidad_disponible, restante);
    asignaciones.push({ id_bodega: bodega.id_bodega, cantidad_asignada: aTomar });
    restante -= aTomar;
  }

  return restante === 0 ? asignaciones : null; 
}