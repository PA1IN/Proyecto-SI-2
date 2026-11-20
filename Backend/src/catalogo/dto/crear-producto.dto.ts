import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Tope de numeric(10,2): un valor mayor fallaría en la BD con 500.
const MAX_NUMERIC = 99_999_999.99;

export class CrearProductoDto {
  @ApiProperty({ example: 1, description: 'ID del tema de LEGO' })
  @IsInt()
  @Min(1)
  id_tema: number;

  @ApiProperty({
    example: '75192-1',
    description: 'SKU único (número de set LEGO)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  sku: string;

  @ApiProperty({ example: 'Millennium Falcon' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre_set: string;

  @ApiProperty({ example: 7541 })
  @IsInt()
  @Min(0)
  cant_piezas: number;

  @ApiPropertyOptional({
    example: 'https://cdn.rebrickable.com/media/sets/75192-1.jpg',
    description: 'URL de la imagen (Rebrickable o Cloudinary)',
  })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(500)
  url_imagen?: string;

  // Peso y medidas de la caja. Si no vienen, se estiman por cantidad de piezas (estimarMedidas).
  @ApiPropertyOptional({ example: 13.2, description: 'Peso de la caja en kg' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(MAX_NUMERIC)
  peso_unitario_kg?: number;

  @ApiPropertyOptional({ example: 53, description: 'Largo de la caja en cm' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(MAX_NUMERIC)
  largo_cm?: number;

  @ApiPropertyOptional({ example: 46, description: 'Alto de la caja en cm' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(MAX_NUMERIC)
  alto_cm?: number;

  @ApiPropertyOptional({ example: 38, description: 'Ancho de la caja en cm' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(MAX_NUMERIC)
  ancho_cm?: number;
}
