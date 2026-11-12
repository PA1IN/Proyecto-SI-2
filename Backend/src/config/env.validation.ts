import 'reflect-metadata';
import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsUrl,
  Matches,
  Max,
  Min,
  validateSync,
  IsBoolean,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  // Origen del frontend (Vite) autorizado por CORS.
  @IsUrl({ require_tld: false, require_protocol: true })
  CORS_ORIGIN: string = 'http://localhost:5173';

  @IsString()
  @IsNotEmpty()
  POSTGRES_HOST: string = 'localhost';

  @IsBoolean()
  // Se lee obj: con enableImplicitConversion, value ya llega como Boolean('false') === true.
  @Transform(
    ({ obj }) => obj.POSTGRES_SSL === 'true' || obj.POSTGRES_SSL === true,
  )
  POSTGRES_SSL: boolean = false;

  @IsString()
  @IsNotEmpty()
  POSTGRES_USER: string = 'inventario';

  @IsString()
  @IsNotEmpty()
  POSTGRES_PASSWORD: string = 'inventario';

  @IsString()
  @IsNotEmpty()
  POSTGRES_DB: string = 'si2_local';

  @IsInt()
  @Min(1)
  @Max(65535)
  POSTGRES_PORT: number = 5432;

  // API keys de los módulos que nos consumen: "modulo:clave,modulo:clave".
  // Vacío = ningún módulo puede llamar a los endpoints de integración (401).
  @Matches(/^([a-z_]+:[^,\s]{16,}(,\s*|$))*$/, {
    message:
      'INTEGRACION_API_KEYS debe tener el formato modulo:clave,modulo:clave (claves de 16 caracteres o más)',
  })
  INTEGRACION_API_KEYS: string = '';
}

// Lo usa ConfigModule al arrancar: si una variable no es válida, la app no inicia.
export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });
  const errors = validateSync(validated);
  if (errors.length > 0) {
    throw new Error(
      `Variables de entorno inválidas:\n${errors.map((e) => Object.values(e.constraints ?? {}).join(', ')).join('\n')}`,
    );
  }
  return validated;
}
