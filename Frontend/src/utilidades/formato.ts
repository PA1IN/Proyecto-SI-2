import type { Movimiento } from '../tipos';

export function formatearNumero(valor: number): string {
  return valor.toLocaleString('es-CL');
}

export function formatearFecha(iso: string): string {
  return new Date(iso)
    .toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(',', '');
}

export function fechaParaFiltro(iso: string): string {
  const fecha = new Date(iso);
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function referenciaExterna(movimiento: Movimiento): string {
  if (movimiento.id_pedido != null) return `Pedido #${movimiento.id_pedido}`;
  if (movimiento.id_devolucion != null) return `Devolución #${movimiento.id_devolucion}`;
  return '—';
}

export function resumenLineas(movimiento: Movimiento): string {
  if (movimiento.detalles.length === 0) return 'Sin líneas';
  const primera = movimiento.detalles[0].producto.nombre_set;
  const extra = movimiento.detalles.length - 1;
  return extra > 0 ? `${primera} +${extra} más` : primera;
}

export function cantidadTotal(movimiento: Movimiento): number {
  return movimiento.detalles.reduce((total, detalle) => total + detalle.cantidad, 0);
}

export function cantidadTotalConSigno(movimiento: Movimiento): string {
  const total = cantidadTotal(movimiento);
  if (movimiento.tipo_operacion === 'AJUSTE') {
    return total > 0 ? `+${total}` : String(total);
  }
  if (
    movimiento.tipo_operacion === 'INGRESO' ||
    movimiento.tipo_operacion === 'LIBERACION' ||
    movimiento.tipo_operacion === 'DEVOLUCION'
  ) {
    return `+${total}`;
  }
  return `-${total}`;
}
