import { DatosEnvio, MetodoPago, PedidoCreado } from "../modelos";
import { pedirJson } from "./http";

export interface ItemSolicitud {
    perfumeId: string;
    cantidad: number;
}

interface RespuestaPedido {
    mensaje: string;
    pedido: PedidoCreado;
}

export const PedidoServicio = {
    async crear(
        cliente: DatosEnvio,
        items: ItemSolicitud[],
        metodoPago: MetodoPago
    ): Promise<PedidoCreado> {
        const respuesta = await pedirJson<RespuestaPedido>("/pedidos", {
            metodo: "POST",
            cuerpo: { cliente, items, metodoPago }
        });
        return respuesta.pedido;
    }
};
