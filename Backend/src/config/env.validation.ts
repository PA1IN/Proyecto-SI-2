import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, Max, Min, validateSync } from 'class-validator';

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
