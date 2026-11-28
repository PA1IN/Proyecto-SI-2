import { IsBoolean, IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegistrarDevolucionDto {
  @ApiProperty({ example: 1, description: 'ID de la devolución en Postventa' })
  @IsInt()
  @IsPositive()
  id_devolucion: number;

  @ApiProperty({ example: 1, description: 'ID de la bodega donde ingresa' })
  @IsInt()
  @IsPositive()
  id_bodega: number;

  @ApiProperty({
    example: true,
    description: 'true si vuelve a disponible; false si llegó dañado (baja con AJUSTE)',
  })
  @IsBoolean()
  apto: boolean;
}