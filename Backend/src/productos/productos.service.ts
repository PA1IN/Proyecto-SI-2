import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ProductosService {
  constructor(private dataSource: DataSource) {}

  async obtenerCatálogoParaFrontend() {
    // Esta consulta une las 3 tablas y renombra las columnas para 
    // cumplir exactamente con el contrato JSON de tipos.ts del frontend.
    const query = `
      SELECT 
        p.id_producto,
        p.sku,
        p.nombre_set,
        t.nombre_tema as tema,
        p.cant_piezas,
        COALESCE(s.cantidad_disponible, 0) as cantidad_disponible,
        COALESCE(s.cantidad_reservada, 0) as cantidad_reservada,
        COALESCE(s.cantidad_minima, 5) as stock_minimo,
        p.activo
      FROM inventario.inv_producto p
      JOIN inventario.inv_temas t ON p.id_tema = t.id_tema
      LEFT JOIN inventario.inv_stock_bodega s ON p.id_producto = s.id_producto
      ORDER BY p.id_producto ASC;
    `;
    
    return this.dataSource.query(query);
  }
}