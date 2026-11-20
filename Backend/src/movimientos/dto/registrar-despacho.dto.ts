import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LineaDespachoDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  id_producto: number;

  @ApiProperty({ example: 3, description: 'Recolectado; 0 si no se encontró' })
  @IsInt()
  @Min(0)
  cantidad: number;
}

// Contrato acordado con Logística el 16-11-2026: un pedido, una guía; lineas con todos los
// productos de la reserva.
export class RegistrarDespachoDto {
  @ApiProperty({
    example: 'GD-52341',
    description: 'ID de la guía de despacho',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  id_despacho: string;

  @ApiPropertyOptional({ description: 'Se acepta pero no se guarda' })
  @IsOptional()
  @IsString()
  num_seguimiento?: string;

  @ApiProperty({ example: 10294 })
  @IsInt()
  @IsPositive()
  id_pedido: number;

  @ApiProperty({ example: 7, description: 'Operador de la OT (rrhh.empleado)' })
  @IsInt()
  @IsPositive()
  id_empleado: number;

  @ApiPropertyOptional({ example: 'Caja 2 con daño leve' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones_picking?: string;

  @ApiProperty({ type: [LineaDespachoDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((linea: LineaDespachoDto) => linea.id_producto, {
    message: 'lineas no puede repetir un id_producto',
  })
  @ValidateNested({ each: true })
  @Type(() => LineaDespachoDto)
  lineas: LineaDespachoDto[];
}
