// RF-06 (admin): detalle de un pedido, cambio de estado (Pendiente -> Pagado -> Enviado) y cancelación
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarraInferior } from "../componentes/BarraInferior";
import { Boton } from "../componentes/Boton";
import { Encabezado } from "../componentes/Encabezado";
import { InsigniaEstado } from "../componentes/InsigniaEstado";
import { useSesionAdmin } from "../estado/SesionAdminContext";
import { EstadoPedido, PedidoCreado } from "../modelos";
import { AdminServicio } from "../servicios/AdminServicio";
import { mensajeDeError } from "../servicios/http";
import { colores } from "../tema";
import { avisar } from "../utilidades/avisos";
import {
    codigoPedido,
    formatearFecha,
    formatearPrecio,
    nombreMetodoPago
} from "../utilidades/formato";

// Mismo flujo que valida el backend
const SIGUIENTE: Record<EstadoPedido, EstadoPedido | null> = {
    Pendiente: "Pagado",
    Pagado: "Enviado",
    Enviado: null,
    Cancelado: null
};

// Se puede cancelar mientras el pedido no haya sido enviado
const CANCELABLES: EstadoPedido[] = ["Pendiente", "Pagado"];

export function AdminPedidoDetallePantalla({ pedidoId }: { pedidoId: string }) {
    const { tokenActual, manejarSesionVencida } = useSesionAdmin();

    const [pedido, setPedido] = useState<PedidoCreado | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [actualizando, setActualizando] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError("");
        try {
            setPedido(await AdminServicio.obtenerPedido(tokenActual, pedidoId));
        } catch (e) {
            if (!manejarSesionVencida(e)) setError(mensajeDeError(e));
        } finally {
            setCargando(false);
        }
    }, [tokenActual, pedidoId, manejarSesionVencida]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const estadoActual = pedido ? (pedido.estado as EstadoPedido) : null;
    const siguiente = estadoActual ? SIGUIENTE[estadoActual] ?? null : null;
    const puedeCancelar = estadoActual ? CANCELABLES.includes(estadoActual) : false;

    const confirmarCambio = (nuevo: EstadoPedido) => {
        if (!pedido) return;
        const cancelando = nuevo === "Cancelado";
        const codigo = codigoPedido(pedido._id);

        Alert.alert(
            cancelando ? "Cancelar pedido" : "Cambiar estado",
            cancelando
                ? `El pedido #${codigo} se cancelará y el stock de sus productos volverá al inventario. Este paso no se puede deshacer.`
                : `El pedido #${codigo} pasará de "${pedido.estado}" a "${nuevo}". Este paso no se puede deshacer.`,
            [
                { text: cancelando ? "Volver" : "Cancelar", style: "cancel" },
                {
                    text: cancelando ? "Cancelar pedido" : "Confirmar",
                    style: cancelando ? "destructive" : "default",
                    onPress: async () => {
                        setActualizando(true);
                        try {
                            await AdminServicio.cambiarEstado(tokenActual, pedido._id, nuevo);
                            avisar(
                                cancelando ? "Pedido cancelado y stock repuesto" : `Estado actualizado: ${nuevo}`
                            );
                            await cargar();
                        } catch (e) {
                            if (!manejarSesionVencida(e)) {
                                Alert.alert("No se pudo cambiar el estado", mensajeDeError(e));
                            }
                        } finally {
                            setActualizando(false);
                        }
                    }
                }
            ]
        );
    };

    const llamar = (telefono: string) => {
        Linking.openURL(`tel:${telefono.replace(/\s/g, "")}`).catch(() =>
            avisar("No se pudo abrir el marcador del teléfono")
        );
    };

    return (
        <View style={estilos.pantalla}>
            <Encabezado
                titulo={pedido ? `Pedido #${codigoPedido(pedido._id)}` : "Pedido"}
                mostrarVolver
                mostrarCarrito={false}
            />

            {cargando && !pedido ? (
                <View style={estilos.centro}>
                    <ActivityIndicator size="large" color={colores.primario} />
                </View>
            ) : error || !pedido ? (
                <View style={estilos.centro}>
                    <Text style={estilos.error}>{error || "No se pudo cargar el pedido."}</Text>
                    <Boton texto="Reintentar" onPress={cargar} />
                </View>
            ) : (
                <>
                    <ScrollView contentContainerStyle={estilos.contenido}>
                        <View style={estilos.fila}>
                            <InsigniaEstado estado={pedido.estado} />
                            <Text style={estilos.fecha}>{formatearFecha(pedido.fechaCreacion)}</Text>
                        </View>

                        <Text style={estilos.seccion}>Productos</Text>
                        <View style={estilos.tarjeta}>
                            {pedido.items.map((i) => (
                                <View key={i.perfumeId} style={estilos.fila}>
                                    <Text style={estilos.texto} numberOfLines={1}>
                                        {i.cantidad} × {i.nombre}
                                    </Text>
                                    <Text style={estilos.texto}>
                                        {formatearPrecio(i.precioUnitario * i.cantidad)}
                                    </Text>
                                </View>
                            ))}
                            <View style={[estilos.fila, estilos.filaTotal]}>
                                <Text style={estilos.total}>Total</Text>
                                <Text style={estilos.total}>{formatearPrecio(pedido.total)}</Text>
                            </View>
                        </View>

                        <Text style={estilos.seccion}>Comprador</Text>
                        <View style={estilos.tarjeta}>
                            <Text style={estilos.nombre}>{pedido.cliente.nombre}</Text>
                            <Text style={estilos.texto}>{pedido.cliente.telefono}</Text>
                            <Text style={estilos.texto}>
                                {pedido.cliente.direccion}, {pedido.cliente.ciudad}
                            </Text>
                            {pedido.cliente.email ? (
                                <Text style={estilos.texto}>{pedido.cliente.email}</Text>
                            ) : null}
                            <View style={{ height: 12 }} />
                            <Boton
                                compacto
                                variante="secundario"
                                texto="Llamar al comprador"
                                onPress={() => llamar(pedido.cliente.telefono)}
                            />
                        </View>

                        <Text style={estilos.seccion}>Pago</Text>
                        <View style={estilos.tarjeta}>
                            <Text style={estilos.texto}>{nombreMetodoPago(pedido.metodoPago)}</Text>
                        </View>
                    </ScrollView>

                    <BarraInferior>
                        {siguiente ? (
                            <Boton
                                texto={`Marcar como ${siguiente}`}
                                onPress={() => confirmarCambio(siguiente)}
                                cargando={actualizando}
                            />
                        ) : estadoActual === "Cancelado" ? (
                            <Text style={estilos.cancelado}>
                                Pedido cancelado: el stock volvió al inventario.
                            </Text>
                        ) : (
                            <Text style={estilos.completo}>
                                Pedido enviado: no quedan más pasos.
                            </Text>
                        )}
                        {puedeCancelar && (
                            <View style={{ marginTop: 8 }}>
                                <Boton
                                    texto="Cancelar pedido"
                                    variante="peligro"
                                    onPress={() => confirmarCambio("Cancelado")}
                                    deshabilitado={actualizando}
                                />
                            </View>
                        )}
                    </BarraInferior>
                </>
            )}
        </View>
    );
}

const estilos = StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    error: { color: colores.error, textAlign: "center", marginBottom: 16, lineHeight: 20 },
    contenido: { padding: 16, paddingBottom: 24 },
    fila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    fecha: { fontSize: 12, color: colores.textoSuave },
    seccion: { fontSize: 15, fontWeight: "700", color: colores.texto, marginTop: 16, marginBottom: 8 },
    tarjeta: {
        backgroundColor: colores.tarjeta,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colores.borde,
        padding: 14
    },
    filaTotal: {
        borderTopWidth: 1,
        borderTopColor: colores.borde,
        paddingTop: 10,
        marginTop: 4,
        marginBottom: 0
    },
    texto: { fontSize: 14, color: colores.texto, flexShrink: 1, marginRight: 8 },
    nombre: { fontSize: 16, fontWeight: "700", color: colores.texto, marginBottom: 4 },
    total: { fontSize: 17, fontWeight: "700", color: colores.texto },
    completo: { textAlign: "center", color: colores.exito, fontWeight: "600", paddingVertical: 8 },
    cancelado: { textAlign: "center", color: colores.error, fontWeight: "600", paddingVertical: 8 }
});
