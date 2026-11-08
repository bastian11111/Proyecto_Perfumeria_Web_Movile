// Capa DTO
// Réplica de la colección "pedidos". Cliente e items van EMBEBIDOS en el pedido.

import { ObjectId } from "mongodb";

export type EstadoPedido = "Pendiente" | "Pagado" | "Enviado";
export type MetodoPago = "transferencia" | "contra_entrega" | "pasarela";

export class Cliente {
    nombre!: string;
    telefono!: string;
    direccion!: string;
    ciudad!: string;
    email?: string;
}

export class ItemPedido {
    perfumeId!: ObjectId;
    nombre!: string;      // copia del nombre al momento de comprar
    precioUnitario!: number; // copia del precio al momento de comprar
    cantidad!: number;
}

export class Pedido {
    _id?: ObjectId;
    cliente!: Cliente;
    items!: ItemPedido[];
    total!: number;
    metodoPago!: MetodoPago;
    estado!: EstadoPedido;
    fechaCreacion!: Date;
}
