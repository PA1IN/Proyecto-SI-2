import { useState } from 'react';
import type { Producto } from '../tipos';

interface MiniaturaProps {
  producto: Producto;
  grande?: boolean;
}

export default function Miniatura({ producto, grande = false }: MiniaturaProps) {
  const [rota, setRota] = useState(false);
  const clase = grande ? 'miniatura miniatura--grande' : 'miniatura';

  if (producto.url_imagen && !rota) {
    return (
      <img
        className={clase}
        src={producto.url_imagen}
        alt={`Set ${producto.nombre_set}`}
        loading="lazy"
        onError={() => setRota(true)}
      />
    );
  }

  return (
    <div className={`${clase} miniatura--vacia`} aria-hidden="true">
      {producto.sku.slice(0, 3).toUpperCase()}
    </div>
  );
}
