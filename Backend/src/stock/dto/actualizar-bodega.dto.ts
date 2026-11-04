import { PartialType } from "@nestjs/swagger";
import { CrearBodegaDto } from "./crear-bodega.dto.js";

export class ActualizarBodegaDto extends PartialType(CrearBodegaDto) {} 