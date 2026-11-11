// Servicios del panel de administración (todas las rutas /admin requieren token).
import { DatosPerfume, EstadoPedido, PedidoCreado, Perfume } from "../modelos";
import { pedirJson } from "./http";

interface Mensaje {
    mensaje: string;
}

export const AdminServicio = {
    async login(email: string, password: string): Promise<string> {
        const respuesta = await pedirJson<{ token: string }>("/auth/login", {
            metodo: "POST",
            cuerpo: { email, password }
        });
        return respuesta.token;
    },

    // ----- Perfumes (RF-01) -----
    listarPerfumes: (token: string) => pedirJson<Perfume[]>("/admin/perfumes", { token }),

    crearPerfume: (token: string, datos: DatosPerfume) =>
        pedirJson<Perfume>("/admin/perfumes", { metodo: "POST", cuerpo: datos, token }),

    editarPerfume: (token: string, id: string, datos: DatosPerfume) =>
        pedirJson<Mensaje>(`/admin/perfumes/${id}`, { metodo: "PUT", cuerpo: datos, token }),

    darDeBaja: (token: string, id: string) =>
        pedirJson<Mensaje>(`/admin/perfumes/${id}`, { metodo: "DELETE", token }),

    reactivar: (token: string, id: string) =>
        pedirJson<Mensaje>(`/admin/perfumes/${id}/reactivar`, { metodo: "PUT", token }),

    // ----- Pedidos (RF-06) -----
    listarPedidos: (token: string, estado?: EstadoPedido) =>
        pedirJson<PedidoCreado[]>(
            estado ? `/admin/pedidos?estado=${estado}` : "/admin/pedidos",
            { token }
        ),

    obtenerPedido: (token: string, id: string) =>
        pedirJson<PedidoCreado>(`/admin/pedidos/${id}`, { token }),

    cambiarEstado: (token: string, id: string, estado: EstadoPedido) =>
        pedirJson<Mensaje>(`/admin/pedidos/${id}/estado`, {
            metodo: "PUT",
            cuerpo: { estado },
            token
        })
};
