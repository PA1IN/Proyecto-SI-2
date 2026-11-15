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

const EQUIVALENCIAS_ROL: Record<string, RolModulo> = {
  //roles propios
  JEFE_BODEGA: ROLES.JEFE_BODEGA,
  OPERADOR_BODEGA: ROLES.OPERADOR_BODEGA,
  CONSULTA: ROLES.CONSULTA,

  //roles segun rrhh
  ADMIN: ROLES.JEFE_BODEGA,
  ADMINISTRADOR: ROLES.JEFE_BODEGA,
  JEFE: ROLES.JEFE_BODEGA,
  COORDINADOR: ROLES.JEFE_BODEGA,

  OPERADOR: ROLES.OPERADOR_BODEGA,
  OPERARIO: ROLES.OPERADOR_BODEGA,
  ANALISTA: ROLES.OPERADOR_BODEGA,

  CONSULTOR: ROLES.CONSULTA,
};

export function normalizarRol(rolCrudo: unknown): RolModulo | null {
  if (typeof rolCrudo !== 'string') return null;
  const limpio = rolCrudo
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  return EQUIVALENCIAS_ROL[limpio] ?? null;
}