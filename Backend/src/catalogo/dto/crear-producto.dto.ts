import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
