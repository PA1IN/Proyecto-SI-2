import type {
  Bodega,
  Movimiento,
  PayloadBodega,
  PayloadProducto,
  Producto,
  ProductoConStock,
  StockBodega,
  StockResumen,
  Tema,
} from './tipos';

const API = '/api/v1';

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${ruta}`, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const msg = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(msg ?? `Error ${res.status}`);
  }
  return (await res.json()) as T;
}

function enviarJson(method: 'POST' | 'PATCH', body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export function fetchProductos(): Promise<Producto[]> {
  return pedir<Producto[]>('/productos');
}

export function fetchStockResumen(): Promise<StockResumen[]> {
  return pedir<StockResumen[]>('/stock');
}

export function fetchTemas(): Promise<Tema[]> {
  return pedir<Tema[]>('/productos/temas');
}

export function fetchBodegas(): Promise<Bodega[]> {
  return pedir<Bodega[]>('/bodegas');
}

export function fetchProducto(idProducto: number): Promise<ProductoConStock> {
  return pedir<ProductoConStock>(`/productos/${idProducto}`);
}

export async function fetchStockProducto(idProducto: number): Promise<StockBodega[]> {
  const res = await fetch(`${API}/stock/${idProducto}`);
  // El backend responde 404 cuando el producto existe pero no tiene filas de stock.
  if (res.status === 404) return [];
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const msg = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(msg ?? `Error ${res.status}`);
  }
  return (await res.json()) as StockBodega[];
}

export function fetchMovimientos(): Promise<Movimiento[]> {
  return pedir<Movimiento[]>('/movimientos');
}

export function fetchMovimiento(idMovimiento: number): Promise<Movimiento> {
  return pedir<Movimiento>(`/movimientos/${idMovimiento}`);
}

// El backend todavía no entrega producto + stock en una sola respuesta.
// Se cruzan aquí para no repetir la lógica en cada página.
export async function fetchCatalogoConStock(): Promise<ProductoConStock[]> {
  const [productos, stock] = await Promise.all([fetchProductos(), fetchStockResumen()]);
  const porProducto = new Map(stock.map((s) => [s.id_producto, s]));

  return productos.map((p) => {
    const s = porProducto.get(p.id_producto);
    return {
      ...p,
      cantidad_disponible: s?.cantidad_disponible ?? 0,
      cantidad_reservada: s?.cantidad_reservada ?? 0,
      cantidad_minima: s?.cantidad_minima ?? 0,
      bodegas_bajo_minimo: s?.bodegas_bajo_minimo ?? 0,
    };
  });
}

export function crearProducto(payload: PayloadProducto): Promise<Producto> {
  return pedir<Producto>('/productos', enviarJson('POST', payload));
}

export function actualizarProducto(idProducto: number, payload: Partial<PayloadProducto>): Promise<Producto> {
  return pedir<Producto>(`/productos/${idProducto}`, enviarJson('PATCH', payload));
}

export function crearBodega(payload: PayloadBodega): Promise<Bodega> {
  return pedir<Bodega>('/bodegas', enviarJson('POST', payload));
}

export function actualizarBodega(idBodega: number, payload: Partial<PayloadBodega>): Promise<Bodega> {
  return pedir<Bodega>(`/bodegas/${idBodega}`, enviarJson('PATCH', payload));
}

export function registrarIngreso(payload: {
  id_empleado: number;
  id_producto: number;
  id_bodega: number;
  cantidad: number;
}): Promise<Movimiento> {
  return pedir<Movimiento>('/movimientos/ingreso', enviarJson('POST', payload));
}

export function registrarAjuste(payload: {
  id_empleado: number;
  id_producto: number;
  id_bodega: number;
  cantidad: number;
}): Promise<Movimiento> {
  return pedir<Movimiento>('/movimientos/ajuste', enviarJson('POST', payload));
}
