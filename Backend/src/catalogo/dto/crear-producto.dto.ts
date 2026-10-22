import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrearProductoDto {
  @ApiProperty({ example: 1, description: 'ID del tema de LEGO' })
  @IsInt()
  @Min(1)
  id_tema: number;

  @ApiProperty({ example: '75192', description: 'SKU único (número de set LEGO)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku: string;

  @ApiProperty({ example: 'Millennium Falcon' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre_set: string;

  @ApiPropertyOptional({ example: 'Ultimate Collector Series' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  coleccion?: string;

  @ApiProperty({ example: 7541 })
  @IsInt()
  @Min(0)
  cant_piezas: number;

  @ApiProperty({ example: 16 })
  @IsInt()
  @Min(0)
  edad_minima: number;

  @ApiPropertyOptional({ example: 'Nave' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  tipo_construccion?: string;

  @ApiPropertyOptional({ example: 2, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock_minimo?: number;
}