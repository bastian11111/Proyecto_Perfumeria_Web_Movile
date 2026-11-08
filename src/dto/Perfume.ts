// Capa DTO
// Réplica de la colección "perfumes". Solo representa el dato.

import { ObjectId } from "mongodb";

export type Genero = "Hombre" | "Mujer" | "Unisex";

export class Perfume {
    _id?: ObjectId;
    nombre!: string;
    marca!: string;
    genero!: Genero;
    volumenMl!: number;
    precio!: number;
    stock!: number;
    descripcion?: string;
    imagenUrl?: string;
    activo!: boolean;   // false = baja lógica (el documento no se borra)
}
