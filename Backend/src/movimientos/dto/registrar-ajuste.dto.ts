import { IsInt, IsNotEmpty, NotEquals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegistrarAjusteDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  id_empleado: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @IsNotEmpty()
  id_producto: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsNotEmpty()
  id_bodega: number;

  @ApiProperty({
    example: -3,
    description: 'Negativo para restar, positivo para sumar',
  })
  @IsInt()
  @NotEquals(0)
  cantidad: number;
}
