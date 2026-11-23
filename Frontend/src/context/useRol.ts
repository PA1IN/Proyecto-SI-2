import { useContext } from 'react';
import { RolContext, type RolContextValue } from './rol-context';

export function useRol(): RolContextValue {
  const contexto = useContext(RolContext);
  if (!contexto) {
    throw new Error('useRol debe usarse dentro de RolProvider');
  }
  return contexto;
}
