import type { Producto } from './tipos';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const MOCK: Producto[] = [
  { id_producto: 1, sku: '10294', nombre_set: 'Titanic', tema: 'Icons', cant_piezas: 9090, cantidad_disponible: 3, cantidad_reservada: 1, stock_minimo: 5, activo: true },
  { id_producto: 2, sku: '75192', nombre_set: 'Millennium Falcon', tema: 'Star Wars', cant_piezas: 7541, cantidad_disponible: 12, cantidad_reservada: 2, stock_minimo: 5, activo: true },
  { id_producto: 3, sku: '21330', nombre_set: 'Home Alone', tema: 'Ideas', cant_piezas: 3955, cantidad_disponible: 0, cantidad_reservada: 0, stock_minimo: 4, activo: true },
  { id_producto: 4, sku: '42143', nombre_set: 'Ferrari Daytona SP3', tema: 'Technic', cant_piezas: 3778, cantidad_disponible: 8, cantidad_reservada: 0, stock_minimo: 3, activo: true },
  { id_producto: 5, sku: '10305', nombre_set: "Lion Knights' Castle", tema: 'Icons', cant_piezas: 4514, cantidad_disponible: 4, cantidad_reservada: 1, stock_minimo: 4, activo: true },
  { id_producto: 6, sku: '76269', nombre_set: 'Avengers Tower', tema: 'Marvel', cant_piezas: 5201, cantidad_disponible: 20, cantidad_reservada: 3, stock_minimo: 5, activo: true },
  { id_producto: 7, sku: '10281', nombre_set: 'Bonsai Tree', tema: 'Botanical', cant_piezas: 878, cantidad_disponible: 35, cantidad_reservada: 5, stock_minimo: 10, activo: true },
  { id_producto: 8, sku: '31208', nombre_set: 'Hokusai Great Wave', tema: 'Art', cant_piezas: 1810, cantidad_disponible: 2, cantidad_reservada: 0, stock_minimo: 6, activo: true },
  { id_producto: 9, sku: '75313', nombre_set: 'AT-AT', tema: 'Star Wars', cant_piezas: 6785, cantidad_disponible: 9, cantidad_reservada: 1, stock_minimo: 3, activo: true },
  { id_producto: 10, sku: '10312', nombre_set: 'Jazz Club', tema: 'Icons', cant_piezas: 2899, cantidad_disponible: 6, cantidad_reservada: 0, stock_minimo: 4, activo: true },
  ...Array.from({ length: 20 }, (_, i): Producto => ({
    id_producto: 11 + i,
    sku: String(60000 + i),
    nombre_set: `Set de prueba ${i + 1}`,
    tema: ['City', 'Friends', 'Creator', 'Ninjago'][i % 4],
    cant_piezas: 200 + i * 37,
    cantidad_disponible: (i * 7) % 15,
    cantidad_reservada: i % 3,
    stock_minimo: 5,
    activo: true,
  })),
];

export async function fetchProductos(): Promise<Producto[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK;
  }
  const res = await fetch('/api/v1/productos');
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const msg = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(msg ?? `Error ${res.status}`);
  }
  return (await res.json()) as Producto[];
}