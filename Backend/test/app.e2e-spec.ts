import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/setup-app.js';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
  });

  it('GET /api/docs-json expone el documento OpenAPI', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);
    expect(res.body.info.title).toBe('API Inventario Lesgo');
  });

  it('una ruta inexistente bajo /api/v1 responde 404', () => {
    return request(app.getHttpServer()).get('/api/v1/no-existe').expect(404);
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
