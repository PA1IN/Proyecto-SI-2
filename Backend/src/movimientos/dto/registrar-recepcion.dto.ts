import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LineaRecepcionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  id_producto: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  id_bodega: number;

  @ApiProperty({ example: 18, description: 'Neta: recibida menos dañada' })
  @IsInt()
  @IsPositive()
  cantidad: number;
}

// Contrato acordado con Logística el 16-11-2026.
export class RegistrarRecepcionDto {
  @ApiProperty({ example: 55 })
  @IsInt()
  @IsPositive()
  id_oc: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @IsPositive()
  id_proveedor: number;

  @ApiProperty({ example: 'GP-8812' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nro_guia_proveedor: string;

  @ApiProperty({
    example: 4,
    description: 'Receptor de Logística (rrhh.empleado)',
  })
  @IsInt()
  @IsPositive()
  id_empleado: number;

  @ApiPropertyOptional({ description: 'Se acepta pero no se guarda' })
  @IsOptional()
  @IsInt()
  id_recepcion_logistica?: number;

  @ApiPropertyOptional({
    description:
      'Se acepta pero no se guarda: la fecha es la del registro en Inventario',
  })
  @IsOptional()
  @IsDateString()
  fecha_recepcion?: string;

  @ApiProperty({ type: [LineaRecepcionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique(
    (linea: LineaRecepcionDto) => `${linea.id_producto}-${linea.id_bodega}`,
    { message: 'lineas no puede repetir el mismo producto en la misma bodega' },
  )
  @ValidateNested({ each: true })
  @Type(() => LineaRecepcionDto)
  lineas: LineaRecepcionDto[];
}
