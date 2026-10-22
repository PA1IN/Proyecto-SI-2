import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/setup-app.js';
import { ExpressAdapter } from '@nestjs/platform-express';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication(new ExpressAdapter());
    setupApp(app);
    await app.init();
  });

  it('GET /api/docs-json expone el documento OpenAPI', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);
    expect(res.body.info.title).toBe('API Inventario Lesgo');
    expect(res.body.paths).toHaveProperty('/api/v1/health');
  });

  it('GET /api/v1/health responde ok', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('una ruta inexistente responde 404 con el formato de error común', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/no-existe')
      .expect(404);
    expect(res.body).toMatchObject({
      statusCode: 404,
      error: 'NOT_FOUND',
      path: '/api/v1/no-existe',
    });
    expect(typeof res.body.message).toBe('string');
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it('permite CORS desde el frontend', () => {
    return request(app.getHttpServer())
      .get('/api/docs-json')
      .set('Origin', 'http://localhost:5173')
      .expect('Access-Control-Allow-Origin', 'http://localhost:5173');
  });

  afterEach(async () => {
    await app.close();
  });
});
