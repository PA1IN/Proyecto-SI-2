import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegistrarReservaDto {
    @ApiProperty({ example: 1, description: 'ID del empleado'})
    @IsInt()
    @IsNotEmpty()
    id_empleado: number;

    @ApiProperty({ example: 1001, description: 'ID del pedido de compras'})
    @IsInt()
    @IsNotEmpty()
    id_pedido: number;

    @ApiProperty({ example: 5 })
    @IsInt()
    @IsNotEmpty()
    id_producto: number;

    @ApiProperty({ example: 2 })
    @IsInt()
    @IsNotEmpty()
    cantidad: number;

}