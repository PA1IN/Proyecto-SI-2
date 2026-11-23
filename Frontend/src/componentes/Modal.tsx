import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  titulo: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ titulo, onClose, children }: ModalProps) {
  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', alPresionar);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener('keydown', alPresionar);
    };
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onClose();
      }}
    >
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={titulo}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <h2 className="modal-titulo">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}
