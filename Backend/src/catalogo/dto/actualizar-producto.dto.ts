import { PartialType } from '@nestjs/swagger';
import { CrearProductoDto } from './crear-producto.dto.js';

export class ActualizarProductoDto extends PartialType(CrearProductoDto) {}
