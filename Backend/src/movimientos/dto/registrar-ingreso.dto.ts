import { IsInt, IsNotEmpty, Min, IsPositive } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegistrarIngresoDto {
    @ApiProperty({ example: 1, description: 'Id del empleado'})
    @IsInt()
    @IsNotEmpty()
    id_empleado: number;

    @ApiProperty({example: 5, description: 'Id del producto'})
    @IsInt()
    @IsNotEmpty()
    id_producto: number;

    @ApiProperty({ example: 2, description: 'Id de la bodega de destino'})
    @IsInt()
    @IsNotEmpty()
    id_bodega:number;

    @ApiProperty({ example: 50, description: 'Cantidad a ingresar'})
    @IsInt()
    @IsPositive()
    cantidad: number;
}