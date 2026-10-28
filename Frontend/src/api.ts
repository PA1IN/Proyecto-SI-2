import type { Producto, Bodega, DetalleStock, Tema } from './tipos';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const MOCK: Producto[] = [
  { id_producto: 1, sku: '77073', nombre_set: 'Battle Bus', tema: 'Fortnite', cant_piezas: 954, cantidad_disponible: 3, cantidad_reservada: 1, stock_minimo: 5, activo: true, bodegas_bajo_minimo: 0 },
  { id_producto: 2, sku: '75192', nombre_set: 'Millennium Falcon', tema: 'Star Wars', cant_piezas: 7541, cantidad_disponible: 12, cantidad_reservada: 2, stock_minimo: 5, activo: true, bodegas_bajo_minimo: 0 },
  { id_producto: 3, sku: '75639', nombre_set: 'The Going Merry Pirate Ship', tema: 'One Piece', cant_piezas: 1376, cantidad_disponible: 0, cantidad_reservada: 0, stock_minimo: 4, activo: true, bodegas_bajo_minimo: 0 },
  { id_producto: 4, sku: '72537', nombre_set: 'Derpy Tiger And Sussie Bird', tema: 'K-pop Demon Hunters', cant_piezas: 825, cantidad_disponible: 8, cantidad_reservada: 0, stock_minimo: 3, activo: true, bodegas_bajo_minimo: 0 },
  { id_producto: 5, sku: '77093', nombre_set: "Ocarina of Time - The Final Battle", tema: 'The Legend of Zelda', cant_piezas: 1003, cantidad_disponible: 4, cantidad_reservada: 1, stock_minimo: 4, activo: true, bodegas_bajo_minimo: 0 },
  { id_producto: 6, sku: '76269', nombre_set: 'Avengers Tower', tema: 'Marvel', cant_piezas: 5201, cantidad_disponible: 20, cantidad_reservada: 3, stock_minimo: 5, activo: true, bodegas_bajo_minimo: 0 },
  { id_producto: 7, sku: '21276', nombre_set: 'The Creeper', tema: 'Minecraft', cant_piezas: 665, cantidad_disponible: 35, cantidad_reservada: 5, stock_minimo: 10, activo: true, bodegas_bajo_minimo: 0 },
  { id_producto: 8, sku: '31208', nombre_set: 'Hokusai Great Wave', tema: 'Art', cant_piezas: 1810, cantidad_disponible: 2, cantidad_reservada: 0, stock_minimo: 6, activo: true, bodegas_bajo_minimo: 0 },
  { id_producto: 9, sku: '75313', nombre_set: 'AT-AT', tema: 'Star Wars', cant_piezas: 6785, cantidad_disponible: 9, cantidad_reservada: 1, stock_minimo: 3, activo: true, bodegas_bajo_minimo: 0 },
  { id_producto: 10, sku: '10312', nombre_set: 'Jazz Club', tema: 'Icons', cant_piezas: 2899, cantidad_disponible: 6, cantidad_reservada: 0, stock_minimo: 4, activo: true, bodegas_bajo_minimo: 0 },
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
    bodegas_bajo_minimo: i % 4 === 0 ? 1 : 0,
  })),
];




export async function fetchProductos(): Promise<Producto[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK;
  }
  
  // Hacemos ambas peticiones en paralelo para que sea súper rápido
  const [resProductos, resStock] = await Promise.all([
    fetch('/api/v1/productos'),
    fetch('/api/v1/stock')
  ]);

  if (!resProductos.ok || !resStock.ok) {
    throw new Error('Error al cargar datos del inventario');
  }
  
  const dataProductos = await resProductos.json();
  const dataStock = await resStock.json();
  
  // Convertimos el arreglo de stock en un "diccionario" (Map) para cruzarlo más fácil
  const stockMap = new Map();
  dataStock.forEach((item: any) => {
    stockMap.set(item.id_producto, item);
  });
  
return dataProductos.map((item: any) => {
    const stockInfo = stockMap.get(item.id_producto) || {};

    return {
      id_producto: item.id_producto,
      sku: item.sku,
      nombre_set: item.nombre_set,
      tema: item.tema ? item.tema.nombre_tema : `Tema #${item.id_tema}`,
      cant_piezas: item.cant_piezas,
      cantidad_disponible: stockInfo.cantidad_disponible || 0,
      cantidad_reservada: stockInfo.cantidad_reservada || 0,
      stock_minimo: stockInfo.cantidad_minima ?? 0, // Corrección: quitamos el 5 inventado
      activo: item.activo,
      bodegas_bajo_minimo: stockInfo.bodegas_bajo_minimo || 0, // Pasamos el dato del backend
    };
  });
}

const MOCK_BODEGAS: Bodega[] = [
  { id_bodega: 1, nombre_bodega: 'Bodega Central Santiago', ubicacion_fisica: 'Av. Americo Vespucio 1500, Pudahuel' },
  { id_bodega: 2, nombre_bodega: 'Bodega Coquimbo', ubicacion_fisica: 'Av. Costanera 2300, Coquimbo' },
  { id_bodega: 3, nombre_bodega: 'Bodega La Serena', ubicacion_fisica: 'Av. Balmaceda 3100, La Serena' },
  { id_bodega: 4, nombre_bodega: 'Bodega Antofagasta', ubicacion_fisica: 'Av. Pedro Aguirre Cerda 9800, Antofagasta' },
];

export async function fetchBodegas(): Promise<Bodega[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return MOCK_BODEGAS;
  }
  
  const res = await fetch('/api/v1/bodegas');
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const msg = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(msg ?? `Error ${res.status}`);
  }
  
  const data = await res.json();
  
  return data.map((item: any) => ({
    id_bodega: item.id_bodega,
    nombre_bodega: item.nombre_bodega,
    ubicacion_fisica: item.ubicacion_fisica || 'Ubicación no especificada',
  }));
}


export async function fetchStockPorProducto(idProducto: number): Promise<DetalleStock[]> {
  const res = await fetch(`/api/v1/stock/${idProducto}`);
  
  if (!res.ok) {
    if (res.status === 404) return []; 
    throw new Error(`Error al cargar el detalle de stock (${res.status})`);
  }
  
  return res.json();
}

export async function fetchTemas(): Promise<Tema[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return Array.from(new Set(MOCK.map((p) => p.tema))).map((nombre_tema, i) => ({
      id_tema: i + 1,
      nombre_tema,
    }));
  }

  const res = await fetch('/api/v1/productos/temas');
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const msg = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(msg ?? `Error al cargar los temas (${res.status})`);
  }

  return res.json();
}

