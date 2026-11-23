import { useContext } from 'react';
import { ToastContext, type MostrarToast } from './toast-context';

export function useToast(): MostrarToast {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return contexto;
}
