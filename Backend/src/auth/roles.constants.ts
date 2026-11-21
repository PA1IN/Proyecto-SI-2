export const ROLES = {
  JEFE_BODEGA: 'JEFE_BODEGA',
  OPERADOR_BODEGA: 'OPERADOR_BODEGA',
  CONSULTA: 'CONSULTA',
} as const;

export type RolModulo = (typeof ROLES)[keyof typeof ROLES];

export interface UsuarioAutenticado {
  id_empleado: number;
  rol: RolModulo;
  rolOriginal: string;
  username?: string;
}

// Solo los roles del módulo, creados por RRHH con estos nombres. Los roles genéricos de RRHH
// (Jefe, Analista, Administrador...) no se aceptan: son de toda la empresa, no de Inventario.
const ROLES_ACEPTADOS: ReadonlySet<string> = new Set(Object.values(ROLES));

export function normalizarRol(rolCrudo: unknown): RolModulo | null {
  if (typeof rolCrudo !== 'string') return null;
  const limpio = rolCrudo
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  return ROLES_ACEPTADOS.has(limpio) ? (limpio as RolModulo) : null;
}