// Navegación mínima por pila (sin librerías extra, para evitar problemas de versiones con Expo).
// Maneja también el botón "atrás" del celular Android y protege las pantallas de administración.
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, View } from "react-native";
import { useSesionAdmin } from "../estado/SesionAdminContext";
import { colores } from "../tema";
import { AdminLoginPantalla } from "../pantallas/AdminLoginPantalla";
import { AdminMenuPantalla } from "../pantallas/AdminMenuPantalla";
import { AdminPedidoDetallePantalla } from "../pantallas/AdminPedidoDetallePantalla";
import { AdminPedidosPantalla } from "../pantallas/AdminPedidosPantalla";
import { AdminPerfumeFormPantalla } from "../pantallas/AdminPerfumeFormPantalla";
import { AdminPerfumesPantalla } from "../pantallas/AdminPerfumesPantalla";
import { AdminReportePantalla } from "../pantallas/AdminReportePantalla";
import { CarritoPantalla } from "../pantallas/CarritoPantalla";
import { CatalogoPantalla } from "../pantallas/CatalogoPantalla";
import { CheckoutPantalla } from "../pantallas/CheckoutPantalla";
import { ConfirmacionPantalla } from "../pantallas/ConfirmacionPantalla";
import { DetallePantalla } from "../pantallas/DetallePantalla";
import { ContextoNavegacion, Ruta } from "./contexto";

export function Navegador() {
    const { token } = useSesionAdmin();
    const [pila, setPila] = useState<Ruta[]>([{ nombre: "catalogo" }]);

    const ir = useCallback((ruta: Ruta) => setPila((p) => [...p, ruta]), []);
    const volver = useCallback(
        () => setPila((p) => (p.length > 1 ? p.slice(0, -1) : p)),
        []
    );
    const reiniciar = useCallback(
        (destino?: Ruta) =>
            setPila(destino ? [{ nombre: "catalogo" }, destino] : [{ nombre: "catalogo" }]),
        []
    );

    const actual = pila[pila.length - 1];

    // Las pantallas de administración exigen sesión: si se cierra o vence, se muestra el login
    const esPantallaAdmin = actual.nombre.startsWith("admin") && actual.nombre !== "adminLogin";
    const sinSesion = esPantallaAdmin && !token;

    useEffect(() => {
        const suscripcion = BackHandler.addEventListener("hardwareBackPress", () => {
            if (actual.nombre === "confirmacion" || sinSesion) {
                reiniciar();
                return true;
            }
            if (pila.length > 1) {
                volver();
                return true;
            }
            return false; // en el catálogo, el botón atrás cierra la app
        });
        return () => suscripcion.remove();
    }, [actual, sinSesion, pila.length, volver, reiniciar]);

    const valor = useMemo(() => ({ ir, volver, reiniciar }), [ir, volver, reiniciar]);

    let pantalla: ReactNode;
    if (sinSesion) {
        pantalla = <AdminLoginPantalla />;
    } else {
        switch (actual.nombre) {
            case "catalogo":
                pantalla = <CatalogoPantalla />;
                break;
            case "detalle":
                pantalla = <DetallePantalla perfumeId={actual.perfumeId} />;
                break;
            case "carrito":
                pantalla = <CarritoPantalla />;
                break;
            case "checkout":
                pantalla = <CheckoutPantalla />;
                break;
            case "confirmacion":
                pantalla = <ConfirmacionPantalla pedido={actual.pedido} />;
                break;
            case "adminLogin":
                pantalla = <AdminLoginPantalla />;
                break;
            case "adminMenu":
                pantalla = <AdminMenuPantalla />;
                break;
            case "adminPerfumes":
                pantalla = <AdminPerfumesPantalla />;
                break;
            case "adminPerfumeForm":
                pantalla = <AdminPerfumeFormPantalla perfume={actual.perfume} />;
                break;
            case "adminPedidos":
                pantalla = <AdminPedidosPantalla />;
                break;
            case "adminPedidoDetalle":
                pantalla = <AdminPedidoDetallePantalla pedidoId={actual.pedidoId} />;
                break;
            case "adminReporte":
                pantalla = <AdminReportePantalla />;
                break;
        }
    }

    return (
        <ContextoNavegacion.Provider value={valor}>
            <View key={`${pila.length}-${sinSesion}`} style={{ flex: 1, backgroundColor: colores.fondo }}>
                {pantalla}
            </View>
        </ContextoNavegacion.Provider>
    );
}
