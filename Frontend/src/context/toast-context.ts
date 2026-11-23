import { createContext } from 'react';

export type MostrarToast = (mensaje: string) => void;

export const ToastContext = createContext<MostrarToast | null>(null);
