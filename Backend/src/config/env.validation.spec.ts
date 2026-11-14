import { Environment, validate } from './env.validation.js';

describe('validate (variables de entorno)', () => {
  it('usa los valores por defecto si faltan', () => {
    expect(validate({})).toMatchObject({
      NODE_ENV: Environment.Development,
      PORT: 3000,
      CORS_ORIGIN: 'http://localhost:5173',
    });
  });

  it('rechaza un CORS_ORIGIN que no es URL', () => {
    expect(() => validate({ CORS_ORIGIN: 'no-es-url' })).toThrow(/CORS_ORIGIN/);
  });

  it('convierte PORT de string a número', () => {
    expect(validate({ NODE_ENV: 'test', PORT: '4000' }).PORT).toBe(4000);
  });

  it('rechaza un PORT inválido', () => {
    expect(() => validate({ PORT: 'abc' })).toThrow(/PORT/);
  });

  it('convierte POSTGRES_SSL de string a booleano', () => {
    expect(validate({ POSTGRES_SSL: 'true' }).POSTGRES_SSL).toBe(true);
    expect(validate({ POSTGRES_SSL: 'false' }).POSTGRES_SSL).toBe(false);
    expect(validate({}).POSTGRES_SSL).toBe(false);
  });

  it('valida el formato de INTEGRACION_API_KEYS', () => {
    const claves = 'ecommerce:0123456789abcdef,logistica:fedcba9876543210';
    expect(validate({}).INTEGRACION_API_KEYS).toBe('');
    expect(
      validate({ INTEGRACION_API_KEYS: claves }).INTEGRACION_API_KEYS,
    ).toBe(claves);
    // Sin nombre de módulo y con clave corta.
    for (const mala of ['0123456789abcdef', 'ecommerce:corta']) {
      expect(() => validate({ INTEGRACION_API_KEYS: mala })).toThrow(
        /INTEGRACION_API_KEYS/,
      );
    }
  });

  it('rechaza un NODE_ENV desconocido', () => {
    expect(() => validate({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });
});
