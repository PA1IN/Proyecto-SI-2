import { Environment, validate } from './env.validation.js';

describe('validate (variables de entorno)', () => {
  it('usa los valores por defecto si faltan', () => {
    expect(validate({})).toMatchObject({
      NODE_ENV: Environment.Development,
      PORT: 3000,
    });
  });

  it('convierte PORT de string a número', () => {
    expect(validate({ NODE_ENV: 'test', PORT: '4000' }).PORT).toBe(4000);
  });

  it('rechaza un PORT inválido', () => {
    expect(() => validate({ PORT: 'abc' })).toThrow(/PORT/);
  });

  it('rechaza un NODE_ENV desconocido', () => {
    expect(() => validate({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });
});
