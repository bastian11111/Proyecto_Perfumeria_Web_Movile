// Capa DTO
// Réplica de la colección "usuarios" (solo administradores en el MVP).

import { ObjectId } from "mongodb";

export class Usuario {
    _id?: ObjectId;
    email!: string;
    passwordHash!: string;
    rol!: "admin";
}
