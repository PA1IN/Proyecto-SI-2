import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

// Compartido entre main.ts y los e2e, para que los tests usen la misma configuración que la app.
export function setupApp(app: INestApplication) {
  // Con "/" inicial: Nest monta su manejador de 404 con este string y Express 5 no lo reconoce sin la barra.
  app.setGlobalPrefix('/api/v1');
  app.enableCors({
    origin: app.get(ConfigService).getOrThrow<string>('CORS_ORIGIN'),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('API Inventario Lesgo')
      .setDescription('Módulo de Inventario del mini-ERP (Grupo 2)')
      .setVersion('1.0')
      .build(),
  );
  SwaggerModule.setup('api/docs', app, document);
}
