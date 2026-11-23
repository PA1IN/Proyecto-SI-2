import { useState, type ReactNode } from 'react';
import type { Rol } from '../tipos';
import { RolContext, type RolContextValue } from './rol-context';

const CLAVE_ROL = 'lesgo-inventario-rol';

function rolGuardado(): Rol {
  const guardado = localStorage.getItem(CLAVE_ROL);
  if (guardado === 'JEFE_BODEGA' || guardado === 'OPERADOR_BODEGA' || guardado === 'CONSULTA') {
    return guardado;
  }
  return 'JEFE_BODEGA';
}

export function RolProvider({ children }: { children: ReactNode }) {
  const [rol, setRolState] = useState<Rol>(rolGuardado);

  const setRol = (nuevo: Rol) => {
    setRolState(nuevo);
    localStorage.setItem(CLAVE_ROL, nuevo);
  };

  const value: RolContextValue = {
    rol,
    setRol,
    esJefe: rol === 'JEFE_BODEGA',
    puedeIngresar: rol === 'JEFE_BODEGA' || rol === 'OPERADOR_BODEGA',
    puedeAjustar: rol === 'JEFE_BODEGA',
    puedeVerHistorial: rol === 'JEFE_BODEGA' || rol === 'OPERADOR_BODEGA',
  };

  return <RolContext.Provider value={value}>{children}</RolContext.Provider>;
}
