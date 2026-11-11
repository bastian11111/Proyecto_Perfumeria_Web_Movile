// RF-06 (admin): listado de pedidos con filtro por estado
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";
import { Boton } from "../componentes/Boton";
import { Chips } from "../componentes/Chips";
import { Encabezado } from "../componentes/Encabezado";
import { InsigniaEstado } from "../componentes/InsigniaEstado";
import { useSesionAdmin } from "../estado/SesionAdminContext";
import { EstadoPedido, PedidoCreado } from "../modelos";
import { useNavegacion } from "../navegacion/contexto";
import { AdminServicio } from "../servicios/AdminServicio";
import { mensajeDeError } from "../servicios/http";
import { colores } from "../tema";
import { codigoPedido, formatearFecha, formatearPrecio } from "../utilidades/formato";

const FILTROS = ["Todos", "Pendiente", "Pagado", "Enviado", "Cancelado"] as const;
type Filtro = (typeof FILTROS)[number];

export function AdminPedidosPantalla() {
    const { ir } = useNavegacion();
    const { tokenActual, manejarSesionVencida } = useSesionAdmin();

    const [pedidos, setPedidos] = useState<PedidoCreado[]>([]);
    const [filtro, setFiltro] = useState<Filtro>("Todos");
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [error, setError] = useState("");

    const cargar = useCallback(
        async (esRefresco: boolean = false) => {
            if (esRefresco) setRefrescando(true);
            else setCargando(true);
            setError("");
            try {
                const estado: EstadoPedido | undefined =
                    filtro === "Todos" ? undefined : (filtro as EstadoPedido);
                setPedidos(await AdminServicio.listarPedidos(tokenActual, estado));
            } catch (e) {
                if (!manejarSesionVencida(e)) setError(mensajeDeError(e));
            } finally {
                setCargando(false);
                setRefrescando(false);
            }
        },
        [tokenActual, filtro, manejarSesionVencida]
    );

    useEffect(() => {
        cargar();
    }, [cargar]);

    return (
        <View style={estilos.pantalla}>
            <Encabezado titulo="Pedidos" mostrarVolver mostrarCarrito={false} />

            <View style={estilos.filtros}>
                <Chips opciones={FILTROS} valor={filtro} onCambiar={setFiltro} />
            </View>

            {cargando ? (
                <View style={estilos.centro}>
                    <ActivityIndicator size="large" color={colores.primario} />
                </View>
            ) : error ? (
                <View style={estilos.centro}>
                    <Text style={estilos.error}>{error}</Text>
                    <Boton texto="Reintentar" onPress={() => cargar()} />
                </View>
            ) : (
                <FlatList
                    data={pedidos}
                    keyExtractor={(p) => p._id}
                    contentContainerStyle={estilos.lista}
                    refreshing={refrescando}
                    onRefresh={() => cargar(true)}
                    ListEmptyComponent={
                        <Text style={estilos.vacio}>
                            {filtro === "Todos"
                                ? "Aún no hay pedidos."
                                : `No hay pedidos con estado ${filtro}.`}
                        </Text>
                    }
                    renderItem={({ item }) => (
                        <Pressable
                            style={estilos.tarjeta}
                            onPress={() => ir({ nombre: "adminPedidoDetalle", pedidoId: item._id })}
                        >
                            <View style={estilos.fila}>
                                <Text style={estilos.codigo}>#{codigoPedido(item._id)}</Text>
                                <InsigniaEstado estado={item.estado} />
                            </View>
                            <Text style={estilos.cliente}>{item.cliente.nombre}</Text>
                            <Text style={estilos.detalle}>
                                {item.items.reduce((suma, i) => suma + i.cantidad, 0)} producto(s) ·{" "}
                                {formatearPrecio(item.total)}
                            </Text>
                            <Text style={estilos.fecha}>{formatearFecha(item.fechaCreacion)}</Text>
                        </Pressable>
                    )}
                />
            )}
        </View>
    );
}

const estilos = StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    filtros: { padding: 16, paddingBottom: 4 },
    centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    error: { color: colores.error, textAlign: "center", marginBottom: 16, lineHeight: 20 },
    lista: { padding: 16 },
    vacio: { textAlign: "center", color: colores.textoSuave, marginTop: 40 },
    tarjeta: {
        backgroundColor: colores.tarjeta,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colores.borde,
        padding: 14,
        marginBottom: 12
    },
    fila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    codigo: { fontSize: 16, fontWeight: "700", color: colores.texto },
    cliente: { fontSize: 15, color: colores.texto, marginTop: 6 },
    detalle: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
    fecha: { fontSize: 12, color: colores.textoSuave, marginTop: 4 }
});
