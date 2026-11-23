import { useRef, useState, type ReactNode } from 'react';
import { ToastContext, type MostrarToast } from './toast-context';

export function ToastProvider({ children }: { children: ReactNode }) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const temporizador = useRef<number | null>(null);

  const mostrarToast: MostrarToast = (nuevo) => {
    if (temporizador.current) window.clearTimeout(temporizador.current);
    setMensaje(nuevo);
    temporizador.current = window.setTimeout(() => setMensaje(null), 3200);
  };

  return (
    <ToastContext.Provider value={mostrarToast}>
      {children}
      {mensaje && (
        <div className="toast" role="status">
          {mensaje}
        </div>
      )}
    </ToastContext.Provider>
  );
}
