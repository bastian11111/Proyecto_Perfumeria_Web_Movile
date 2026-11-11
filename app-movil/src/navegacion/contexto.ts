// Contexto de navegación (separado de Navegador.tsx para evitar importaciones circulares).
import { createContext, useContext } from "react";
import { PedidoCreado, Perfume } from "../modelos";

export type Ruta =
    | { nombre: "catalogo" }
    | { nombre: "detalle"; perfumeId: string }
    | { nombre: "carrito" }
    | { nombre: "checkout" }
    | { nombre: "confirmacion"; pedido: PedidoCreado }
    | { nombre: "adminLogin" }
    | { nombre: "adminMenu" }
    | { nombre: "adminPerfumes" }
    | { nombre: "adminPerfumeForm"; perfume?: Perfume }
    | { nombre: "adminPedidos" }
    | { nombre: "adminPedidoDetalle"; pedidoId: string };

export interface ValorNavegacion {
    ir: (ruta: Ruta) => void;
    volver: () => void;
    // Vuelve al catálogo (y, opcionalmente, deja una pantalla encima de él)
    reiniciar: (destino?: Ruta) => void;
}

export const ContextoNavegacion = createContext<ValorNavegacion | null>(null);

export function useNavegacion(): ValorNavegacion {
    const valor = useContext(ContextoNavegacion);
    if (!valor) throw new Error("useNavegacion debe usarse dentro de Navegador");
    return valor;
}
