import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConsultarReservaDto {
  @ApiProperty({ example: 1001, description: 'ID del pedido de e-Commerce' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id_pedido: number;
}
