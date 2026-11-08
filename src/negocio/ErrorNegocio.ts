// Error que lanza la capa de NEGOCIO cuando una regla no se cumple.
// Lleva un código HTTP sugerido para que la capa de servicio lo traduzca
// sin tener que conocer la regla.

import { ObjectId } from "mongodb";

export class ErrorNegocio extends Error {
    estado: number;

    constructor(mensaje: string, estado: number = 400) {
        super(mensaje);
        this.name = "ErrorNegocio";
        this.estado = estado;
    }
}

export function aObjectId(id: string): ObjectId {
    if (!ObjectId.isValid(id)) {
        throw new ErrorNegocio("Identificador no válido", 400);
    }
    return new ObjectId(id);
}
