import { IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Libera la reserva completa del pedido. Sin id_empleado: la dispara e-Commerce.
export class LiberarReservaDto {
  @ApiProperty({ example: 1001, description: 'ID del pedido de e-Commerce' })
  @IsInt()
  @IsPositive()
  id_pedido: number;
}
