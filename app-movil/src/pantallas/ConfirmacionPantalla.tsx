// RF-05: confirmación del pedido registrado
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BarraInferior } from "../componentes/BarraInferior";
import { Boton } from "../componentes/Boton";
import { PedidoCreado } from "../modelos";
import { useNavegacion } from "../navegacion/contexto";
import { colores } from "../tema";
import { formatearPrecio, nombreMetodoPago } from "../utilidades/formato";

export function ConfirmacionPantalla({ pedido }: { pedido: PedidoCreado }) {
    const { reiniciar } = useNavegacion();
    const codigo = pedido._id.slice(-6).toUpperCase();

    return (
        <View style={estilos.pantalla}>
            <ScrollView contentContainerStyle={estilos.contenido}>
                <Text style={estilos.check}>✓</Text>
                <Text style={estilos.titulo}>¡Pedido registrado!</Text>
                <Text style={estilos.codigo}>Número de pedido: #{codigo}</Text>

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

                <View style={estilos.tarjeta}>
                    <Text style={estilos.etiqueta}>Método de pago</Text>
                    <Text style={estilos.texto}>{nombreMetodoPago(pedido.metodoPago)}</Text>
                    <Text style={[estilos.etiqueta, { marginTop: 10 }]}>Envío a</Text>
                    <Text style={estilos.texto}>
                        {pedido.cliente.nombre} · {pedido.cliente.telefono}
                    </Text>
                    <Text style={estilos.texto}>
                        {pedido.cliente.direccion}, {pedido.cliente.ciudad}
                    </Text>
                    <Text style={[estilos.etiqueta, { marginTop: 10 }]}>Estado</Text>
                    <Text style={estilos.texto}>{pedido.estado}</Text>
                </View>

                <Text style={estilos.nota}>
                    Te contactaremos al teléfono indicado para coordinar el pago y el envío.
                </Text>
            </ScrollView>

            <BarraInferior>
                <Boton texto="Volver al catálogo" onPress={() => reiniciar()} />
            </BarraInferior>
        </View>
    );
}

const estilos = StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    contenido: { padding: 20, paddingTop: 64, alignItems: "stretch" },
    check: {
        alignSelf: "center",
        width: 72,
        height: 72,
        lineHeight: 72,
        borderRadius: 36,
        textAlign: "center",
        fontSize: 38,
        color: "#FFFFFF",
        backgroundColor: colores.exito,
        overflow: "hidden"
    },
    titulo: {
        fontSize: 24,
        fontWeight: "700",
        color: colores.texto,
        textAlign: "center",
        marginTop: 16
    },
    codigo: { textAlign: "center", color: colores.textoSuave, marginTop: 4, marginBottom: 20 },
    tarjeta: {
        backgroundColor: colores.tarjeta,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colores.borde,
        padding: 14,
        marginBottom: 14
    },
    fila: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    filaTotal: {
        borderTopWidth: 1,
        borderTopColor: colores.borde,
        paddingTop: 10,
        marginTop: 4,
        marginBottom: 0
    },
    texto: { fontSize: 14, color: colores.texto, flexShrink: 1, marginRight: 8 },
    total: { fontSize: 17, fontWeight: "700", color: colores.texto },
    etiqueta: { fontSize: 12, color: colores.textoSuave, fontWeight: "600" },
    nota: { fontSize: 13, color: colores.textoSuave, textAlign: "center", marginTop: 4 },
});
