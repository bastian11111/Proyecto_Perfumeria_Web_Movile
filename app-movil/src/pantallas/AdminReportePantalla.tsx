// Reporte de ventas (admin): resumen del período, pedidos por estado, más vendidos y stock bajo
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarraInferior } from "../componentes/BarraInferior";
import { Boton } from "../componentes/Boton";
import { Chips } from "../componentes/Chips";
import { Encabezado } from "../componentes/Encabezado";
import { InsigniaEstado } from "../componentes/InsigniaEstado";
import { useSesionAdmin } from "../estado/SesionAdminContext";
import { EstadoPedido, ReporteVentas } from "../modelos";
import { AdminServicio } from "../servicios/AdminServicio";
import { mensajeDeError } from "../servicios/http";
import { colores } from "../tema";
import { formatearPrecio } from "../utilidades/formato";

const PERIODOS = ["Hoy", "7 días", "30 días", "Todo"] as const;
type Periodo = (typeof PERIODOS)[number];

const ESTADOS: EstadoPedido[] = ["Pendiente", "Pagado", "Enviado", "Cancelado"];

// Inicio del período, en hora local del celular (se envía como fecha ISO)
function desdeDe(periodo: Periodo): string | undefined {
    if (periodo === "Todo") return undefined;
    const ahora = new Date();
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    if (periodo === "7 días") inicio.setDate(inicio.getDate() - 6);
    if (periodo === "30 días") inicio.setDate(inicio.getDate() - 29);
    return inicio.toISOString();
}

interface DatoProps {
    etiqueta: string;
    valor: string;
}

function Dato({ etiqueta, valor }: DatoProps) {
    return (
        <View style={estilos.dato}>
            <Text style={estilos.datoEtiqueta}>{etiqueta}</Text>
            <Text style={estilos.datoValor}>{valor}</Text>
        </View>
    );
}

export function AdminReportePantalla() {
    const { tokenActual, manejarSesionVencida } = useSesionAdmin();

    const [periodo, setPeriodo] = useState<Periodo>("30 días");
    const [reporte, setReporte] = useState<ReporteVentas | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const cargar = useCallback(async () => {
        setCargando(true);
        setError("");
        try {
            setReporte(await AdminServicio.reporteVentas(tokenActual, desdeDe(periodo)));
        } catch (e) {
            if (!manejarSesionVencida(e)) setError(mensajeDeError(e));
        } finally {
            setCargando(false);
        }
    }, [tokenActual, periodo, manejarSesionVencida]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    return (
        <View style={estilos.pantalla}>
            <Encabezado titulo="Reporte de ventas" mostrarVolver mostrarCarrito={false} />

            <View style={estilos.filtros}>
                <Chips opciones={PERIODOS} valor={periodo} onCambiar={setPeriodo} />
            </View>

            {cargando && !reporte ? (
                <View style={estilos.centro}>
                    <ActivityIndicator size="large" color={colores.primario} />
                </View>
            ) : error || !reporte ? (
                <View style={estilos.centro}>
                    <Text style={estilos.error}>{error || "No se pudo cargar el reporte."}</Text>
                    <Boton texto="Reintentar" onPress={cargar} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={estilos.contenido}>
                    <View style={estilos.grilla}>
                        <Dato etiqueta="Ventas confirmadas" valor={formatearPrecio(reporte.ventasConfirmadas)} />
                        <Dato etiqueta="Pedidos" valor={String(reporte.totalPedidos)} />
                        <Dato etiqueta="Ticket promedio" valor={formatearPrecio(reporte.ticketPromedio)} />
                        <Dato etiqueta="Por cobrar (Pendientes)" valor={formatearPrecio(reporte.ventasPendientes)} />
                    </View>
                    <Text style={estilos.nota}>
                        Ventas confirmadas = pedidos Pagados y Enviados. Los cancelados suman{" "}
                        {formatearPrecio(reporte.montoCancelado)}.
                    </Text>

                    <Text style={estilos.seccion}>Pedidos por estado</Text>
                    <View style={estilos.tarjeta}>
                        {ESTADOS.map((estado) => (
                            <View key={estado} style={estilos.fila}>
                                <InsigniaEstado estado={estado} />
                                <Text style={estilos.cantidad}>{reporte.pedidosPorEstado[estado]}</Text>
                            </View>
                        ))}
                    </View>

                    <Text style={estilos.seccion}>Perfumes más vendidos</Text>
                    <View style={estilos.tarjeta}>
                        {reporte.perfumesMasVendidos.length === 0 ? (
                            <Text style={estilos.vacio}>
                                Aún no hay ventas confirmadas en este período.
                            </Text>
                        ) : (
                            reporte.perfumesMasVendidos.map((p, indice) => (
                                <View key={p.perfumeId} style={estilos.fila}>
                                    <Text style={estilos.texto} numberOfLines={1}>
                                        {indice + 1}. {p.nombre}
                                    </Text>
                                    <Text style={estilos.texto}>
                                        {p.unidades} u. · {formatearPrecio(p.ingresos)}
                                    </Text>
                                </View>
                            ))
                        )}
                    </View>

                    <Text style={estilos.seccion}>
                        Stock bajo ({reporte.umbralStock} o menos unidades)
                    </Text>
                    <View style={estilos.tarjeta}>
                        {reporte.stockBajo.length === 0 ? (
                            <Text style={estilos.vacio}>Sin alertas de stock.</Text>
                        ) : (
                            reporte.stockBajo.map((p) => (
                                <View key={p.perfumeId} style={estilos.fila}>
                                    <Text style={estilos.texto} numberOfLines={1}>
                                        {p.marca} · {p.nombre}
                                    </Text>
                                    <Text style={[estilos.stock, p.stock === 0 && estilos.sinStock]}>
                                        {p.stock === 0 ? "Agotado" : `${p.stock} u.`}
                                    </Text>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>
            )}

            <BarraInferior>
                <Boton texto="Actualizar" variante="secundario" onPress={cargar} cargando={cargando} />
            </BarraInferior>
        </View>
    );
}

const estilos = StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    filtros: { padding: 16, paddingBottom: 4 },
    centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    error: { color: colores.error, textAlign: "center", marginBottom: 16, lineHeight: 20 },
    contenido: { padding: 16, paddingBottom: 24 },
    grilla: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
    dato: {
        width: "50%",
        paddingHorizontal: 6,
        marginBottom: 12
    },
    datoEtiqueta: { fontSize: 12, color: colores.textoSuave, marginBottom: 2 },
    datoValor: { fontSize: 20, fontWeight: "700", color: colores.texto },
    nota: { fontSize: 12, color: colores.textoSuave, lineHeight: 17 },
    seccion: { fontSize: 15, fontWeight: "700", color: colores.texto, marginTop: 20, marginBottom: 8 },
    tarjeta: {
        backgroundColor: colores.tarjeta,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colores.borde,
        padding: 14
    },
    fila: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8
    },
    cantidad: { fontSize: 16, fontWeight: "700", color: colores.texto },
    texto: { fontSize: 14, color: colores.texto, flexShrink: 1, marginRight: 8 },
    stock: { fontSize: 14, fontWeight: "600", color: colores.texto },
    sinStock: { color: colores.error },
    vacio: { fontSize: 14, color: colores.textoSuave }
});
