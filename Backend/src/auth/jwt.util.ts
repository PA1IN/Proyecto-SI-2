import { createHmac, timingSafeEqual } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import { normalizarRol, UsuarioAutenticado } from './roles.constants.js';

function base64UrlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf8');
}

export function firmarJwtHs256(
  payload: Record<string, unknown>,
  secreto: string,
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const firma = createHmac('sha256', secreto)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${firma}`;
}

export function verificarJwtHs256(
  token: string,
  secreto: string,
): UsuarioAutenticado {
  if (!secreto) {
    throw new UnauthorizedException('JWT_SECRET no está configurado');
  }

  const partes = token.split('.');
  if (partes.length !== 3) {
    throw new UnauthorizedException('Formato de token JWT inválido');
  }

  const [headerB64, payloadB64, firmaB64] = partes;

  let header: { alg?: string };
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(base64UrlDecode(headerB64));
    payload = JSON.parse(base64UrlDecode(payloadB64));
  } catch {
    throw new UnauthorizedException('Token JWT malformado');
  }

  if (header.alg !== 'HS256') {
    throw new UnauthorizedException('Algoritmo JWT no soportado (se exige HS256)');
  }

  const firmaEsperada = createHmac('sha256', secreto)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const firmaRecibida = Buffer.from(firmaB64, 'base64url');

  if (
    firmaEsperada.length !== firmaRecibida.length ||
    !timingSafeEqual(firmaEsperada, firmaRecibida)
  ) {
    throw new UnauthorizedException('Firma del token JWT inválida');
  }

  if (typeof payload.exp === 'number') {
    const ahoraSegundos = Math.floor(Date.now() / 1000);
    if (ahoraSegundos >= payload.exp) {
      throw new UnauthorizedException('El token JWT ha expirado');
    }
  }

  const rawId = payload.employeeId ?? payload.id_empleado ?? payload.sub;
  const idEmpleado = typeof rawId === 'string' ? Number(rawId) : rawId;
  if (
    typeof idEmpleado !== 'number' ||
    !Number.isInteger(idEmpleado) ||
    idEmpleado < 1
  ) {
    throw new UnauthorizedException(
      'El token JWT no contiene un employeeId válido',
    );
  }

  const candidatosRol = Array.isArray(payload.roles)
    ? payload.roles
    : [payload.role ?? payload.rol];

  let rolNormalizado = null;
  let rolOriginal = '';
  for (const candidato of candidatosRol) {
    const norm = normalizarRol(candidato);
    if (norm) {
      rolNormalizado = norm;
      rolOriginal = String(candidato);
      break;
    }
  }

  if (!rolNormalizado) {
    throw new UnauthorizedException(
      'El token JWT no contiene un rol autorizado para Inventario',
    );
  }

  return {
    id_empleado: idEmpleado,
    rol: rolNormalizado,
    rolOriginal,
    username:
      typeof payload.username === 'string' ? payload.username : undefined,
  };
}