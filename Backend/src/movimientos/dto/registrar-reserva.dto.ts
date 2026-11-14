import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LineaReservaDto {
  @ApiProperty({ example: 5 })
  @IsInt()
  @IsPositive()
  id_producto: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  cantidad: number;
}

// Sin id_empleado: la reserva la dispara e-Commerce, no un empleado (queda NULL en la BD).
export class RegistrarReservaDto {
  @ApiProperty({ example: 1001, description: 'ID del pedido de e-Commerce' })
  @IsInt()
  @IsPositive()
  id_pedido: number;

  @ApiProperty({ type: [LineaReservaDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((linea: LineaReservaDto) => linea.id_producto, {
    message: 'lineas no puede repetir un id_producto',
  })
  @ValidateNested({ each: true })
  @Type(() => LineaReservaDto)
  lineas: LineaReservaDto[];
}
