import { createContext } from 'react';
import type { Rol } from '../tipos';

export interface RolContextValue {
  rol: Rol;
  setRol: (rol: Rol) => void;
  esJefe: boolean;
  puedeIngresar: boolean;
  puedeAjustar: boolean;
  puedeVerHistorial: boolean;
}

export const RolContext = createContext<RolContextValue | null>(null);
