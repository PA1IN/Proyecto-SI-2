import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CrearBodegaDto {
  @ApiProperty({ example: 'Bodega Norte' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre_bodega: string;

  @ApiProperty({ example: 'Av. Principal 123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  ubicacion_fisica: string;
}
