// Capa de NEGOCIO - Pedidos (RF-02, RF-05, RF-06)
// Crea pedidos, descuenta stock y controla el flujo de estados.
// Usa los DTO y la capa de conexión; nunca se conecta directo a MongoDB.

import { Collection, ClientSession, ObjectId } from "mongodb";
import { Perfume } from "../dto/Perfume";
import { Pedido, Cliente, ItemPedido, MetodoPago, EstadoPedido } from "../dto/Pedido";
import { ConexionMongo } from "../conexion/ConexionMongo";
import { ErrorNegocio, aObjectId } from "./ErrorNegocio";

const METODOS_PAGO: MetodoPago[] = ["transferencia", "contra_entrega", "pasarela"];

// Flujo permitido: Pendiente -> Pagado -> Enviado.
// Un pedido se puede cancelar mientras no haya sido enviado (Pendiente o Pagado);
// al cancelar, el stock de sus productos vuelve al inventario. Cancelado y Enviado son finales.
const TRANSICIONES: Record<EstadoPedido, EstadoPedido[]> = {
    Pendiente: ["Pagado", "Cancelado"],
    Pagado: ["Enviado", "Cancelado"],
    Enviado: [],
    Cancelado: []
};

export interface ItemSolicitud {
    perfumeId: string;
    cantidad: number;
}

export class PedidoNegocio {

    private async pedidos(): Promise<Collection<Pedido>> {
        return ConexionMongo.coleccion<Pedido>("pedidos");
    }

    private async perfumes(): Promise<Collection<Perfume>> {
        return ConexionMongo.coleccion<Perfume>("perfumes");
    }

    private usaTransacciones(): boolean {
        return process.env.USAR_TRANSACCIONES === "true";
    }

    private validarCliente(c: Partial<Cliente> | undefined): Cliente {
        if (!c) throw new ErrorNegocio("Faltan los datos de envío");
        const obligatorios: (keyof Cliente)[] = ["nombre", "telefono", "direccion", "ciudad"];
        for (const campo of obligatorios) {
            const valor = c[campo];
            if (!valor || String(valor).trim() === "") {
                throw new ErrorNegocio(`El campo "${campo}" es obligatorio`);
            }
        }
        if (!/^[0-9+\s-]{7,15}$/.test(c.telefono!.trim())) {
            throw new ErrorNegocio("El teléfono no tiene un formato válido");
        }
        return Object.assign(new Cliente(), {
            nombre: c.nombre!.trim(),
            telefono: c.telefono!.trim(),
            direccion: c.direccion!.trim(),
            ciudad: c.ciudad!.trim(),
            email: c.email?.trim() ?? ""
        });
    }

    // Une líneas repetidas del mismo perfume y valida cantidades
    private normalizarItems(items: ItemSolicitud[] | undefined): Map<string, number> {
        if (!Array.isArray(items) || items.length === 0) {
            throw new ErrorNegocio("El carrito está vacío");
        }
        const mapa = new Map<string, number>();
        for (const it of items) {
            if (!Number.isInteger(it.cantidad) || it.cantidad <= 0) {
                throw new ErrorNegocio("Cada cantidad debe ser un entero mayor a 0");
            }
            aObjectId(it.perfumeId); // valida el formato
            mapa.set(it.perfumeId, (mapa.get(it.perfumeId) ?? 0) + it.cantidad);
        }
        return mapa;
    }

    // RF-02: resta del stock la cantidad comprada de cada perfume.
    // La condición stock >= cantidad evita stock negativo si dos clientes
    // compran el último frasco al mismo tiempo.
    private async descontarStock(items: ItemPedido[], session?: ClientSession): Promise<void> {
        const col = await this.perfumes();
        const hechos: ItemPedido[] = [];
        try {
            for (const it of items) {
                const r = await col.updateOne(
                    { _id: it.perfumeId, activo: true, stock: { $gte: it.cantidad } },
                    { $inc: { stock: -it.cantidad } },
                    { session }
                );
                if (r.modifiedCount === 0) {
                    throw new ErrorNegocio(`Stock insuficiente para "${it.nombre}"`, 409);
                }
                hechos.push(it);
            }
        } catch (error) {
            // Sin transacción hay que deshacer a mano lo que ya se descontó
            if (!session) await this.reponerStock(hechos);
            throw error;
        }
    }

    private async reponerStock(items: ItemPedido[], session?: ClientSession): Promise<void> {
        const col = await this.perfumes();
        for (const it of items) {
            await col.updateOne(
                { _id: it.perfumeId },
                { $inc: { stock: it.cantidad } },
                { session }
            );
        }
    }

    // Cancela un pedido y devuelve su stock al inventario.
    // El cambio de estado va PRIMERO y es condicional ("solo si sigue en el estado que leí"):
    // si dos cancelaciones llegan a la vez, solo una gana y el stock se repone una sola vez.
    private async cancelar(pedido: Pedido): Promise<void> {
        const colPedidos = await this.pedidos();
        const conflicto = () =>
            new ErrorNegocio("El pedido cambió de estado. Actualiza e inténtalo de nuevo", 409);

        if (this.usaTransacciones()) {
            const session = await ConexionMongo.iniciarSesion();
            try {
                await session.withTransaction(async () => {
                    const r = await colPedidos.updateOne(
                        { _id: pedido._id, estado: pedido.estado },
                        { $set: { estado: "Cancelado" as EstadoPedido } },
                        { session }
                    );
                    if (r.modifiedCount === 0) throw conflicto();
                    await this.reponerStock(pedido.items, session);
                });
            } finally {
                await session.endSession();
            }
            return;
        }

        const r = await colPedidos.updateOne(
            { _id: pedido._id, estado: pedido.estado },
            { $set: { estado: "Cancelado" as EstadoPedido } }
        );
        if (r.modifiedCount === 0) throw conflicto();

        try {
            await this.reponerStock(pedido.items);
        } catch (error) {
            // Sin transacción: si falla la reposición, se deshace el cambio de estado
            await colPedidos.updateOne({ _id: pedido._id }, { $set: { estado: pedido.estado } });
            throw error;
        }
    }

    // RF-05: crea el pedido (estado inicial Pendiente) y descuenta el stock
    async crear(
        clienteDatos: Partial<Cliente> | undefined,
        itemsSolicitados: ItemSolicitud[] | undefined,
        metodoPago: MetodoPago
    ): Promise<Pedido> {
        const cliente = this.validarCliente(clienteDatos);
        if (!METODOS_PAGO.includes(metodoPago)) {
            throw new ErrorNegocio("Método de pago no válido");
        }
        const solicitados = this.normalizarItems(itemsSolicitados);

        // Se leen los perfumes activos para tomar nombre y precio REALES de la base
        // (nunca se confía en el precio que manda la app).
        const colPerfumes = await this.perfumes();
        const ids = [...solicitados.keys()].map((id) => new ObjectId(id));
        const encontrados = await colPerfumes.find({ _id: { $in: ids }, activo: true }).toArray();
        if (encontrados.length !== ids.length) {
            throw new ErrorNegocio("Uno o más perfumes ya no están disponibles", 409);
        }

        const items: ItemPedido[] = encontrados.map((p) =>
            Object.assign(new ItemPedido(), {
                perfumeId: p._id!,
                nombre: p.nombre,
                precioUnitario: p.precio,
                cantidad: solicitados.get(p._id!.toHexString())!
            })
        );

        const total = Math.round(
            items.reduce((suma, it) => suma + it.precioUnitario * it.cantidad, 0) * 100
        ) / 100;

        const pedido = Object.assign(new Pedido(), {
            _id: new ObjectId(),
            cliente,
            items,
            total,
            metodoPago,
            estado: "Pendiente" as EstadoPedido,
            fechaCreacion: new Date()
        });

        const colPedidos = await this.pedidos();

        if (this.usaTransacciones()) {
            const session = await ConexionMongo.iniciarSesion();
            try {
                await session.withTransaction(async () => {
                    await this.descontarStock(items, session);
                    await colPedidos.insertOne(pedido, { session });
                });
            } finally {
                await session.endSession();
            }
        } else {
            await this.descontarStock(items);
            try {
                await colPedidos.insertOne(pedido);
            } catch (error) {
                await this.reponerStock(items);
                throw error;
            }
        }

        return pedido;
    }

    // RF-06: listado para el panel de administración
    async listar(estado?: string): Promise<Pedido[]> {
        const col = await this.pedidos();
        const filtro: { estado?: EstadoPedido } = {};
        if (estado) {
            if (!(estado in TRANSICIONES)) throw new ErrorNegocio("Estado no válido");
            filtro.estado = estado as EstadoPedido;
        }
        return col.find(filtro).sort({ fechaCreacion: -1 }).toArray();
    }

    async obtener(id: string): Promise<Pedido> {
        const col = await this.pedidos();
        const pedido = await col.findOne({ _id: aObjectId(id) });
        if (!pedido) throw new ErrorNegocio("Pedido no encontrado", 404);
        return pedido;
    }

    // RF-06: cambia el estado respetando el flujo Pendiente -> Pagado -> Enviado
    async cambiarEstado(id: string, nuevoEstado: string): Promise<void> {
        if (!(nuevoEstado in TRANSICIONES)) {
            throw new ErrorNegocio("Estado no válido");
        }
        const pedido = await this.obtener(id);
        const permitidos = TRANSICIONES[pedido.estado];
        if (!permitidos.includes(nuevoEstado as EstadoPedido)) {
            throw new ErrorNegocio(
                `No se puede pasar de "${pedido.estado}" a "${nuevoEstado}"`,
                409
            );
        }
        if (nuevoEstado === "Cancelado") {
            await this.cancelar(pedido);
            return;
        }

        const col = await this.pedidos();
        await col.updateOne(
            { _id: pedido._id, estado: pedido.estado },
            { $set: { estado: nuevoEstado as EstadoPedido } }
        );
    }
}
