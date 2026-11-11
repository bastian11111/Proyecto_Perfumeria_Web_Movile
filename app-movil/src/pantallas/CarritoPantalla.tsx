// RF-04: carrito de compras
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { BarraInferior } from "../componentes/BarraInferior";
import { Boton } from "../componentes/Boton";
import { Encabezado } from "../componentes/Encabezado";
import { SelectorCantidad } from "../componentes/SelectorCantidad";
import { useCarrito } from "../estado/CarritoContext";
import { useNavegacion } from "../navegacion/contexto";
import { colores } from "../tema";
import { formatearPrecio } from "../utilidades/formato";

export function CarritoPantalla() {
    const { ir, volver, reiniciar } = useNavegacion();
    const { items, total, cambiarCantidad, quitar, vaciar } = useCarrito();

    const confirmarVaciar = () => {
        Alert.alert("Vaciar carrito", "¿Quitar todos los productos del carrito?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Vaciar", style: "destructive", onPress: vaciar }
        ]);
    };

    return (
        <View style={estilos.pantalla}>
            <Encabezado titulo="Carrito" mostrarVolver mostrarCarrito={false} />

            {items.length === 0 ? (
                <View style={estilos.centro}>
                    <Text style={estilos.vacioEmoji}>🛒</Text>
                    <Text style={estilos.vacioTexto}>Tu carrito está vacío</Text>
                    <Boton texto="Ver catálogo" onPress={() => reiniciar()} />
                </View>
            ) : (
                <>
                    <FlatList
                        data={items}
                        keyExtractor={(i) => i.perfume._id}
                        contentContainerStyle={estilos.lista}
                        ListFooterComponent={
                            <Pressable onPress={confirmarVaciar} style={estilos.vaciar}>
                                <Text style={estilos.vaciarTexto}>Vaciar carrito</Text>
                            </Pressable>
                        }
                        renderItem={({ item }) => (
                            <View style={estilos.fila}>
                                <Text style={estilos.marca}>{item.perfume.marca.toUpperCase()}</Text>
                                <Text style={estilos.nombre}>{item.perfume.nombre}</Text>
                                <Text style={estilos.detalle}>
                                    {item.perfume.volumenMl} ml ·{" "}
                                    {formatearPrecio(item.perfume.precio)} c/u
                                </Text>
                                <View style={estilos.controles}>
                                    <SelectorCantidad
                                        valor={item.cantidad}
                                        max={item.perfume.stock}
                                        onCambiar={(n) => cambiarCantidad(item.perfume._id, n)}
                                    />
                                    <Text style={estilos.subtotal}>
                                        {formatearPrecio(item.perfume.precio * item.cantidad)}
                                    </Text>
                                </View>
                                <Pressable onPress={() => quitar(item.perfume._id)}>
                                    <Text style={estilos.quitar}>Quitar</Text>
                                </Pressable>
                            </View>
                        )}
                    />

                    <BarraInferior>
                        <View style={estilos.totalFila}>
                            <Text style={estilos.totalEtiqueta}>Total</Text>
                            <Text style={estilos.total}>{formatearPrecio(total)}</Text>
                        </View>
                        <Boton
                            texto="Continuar con la compra"
                            onPress={() => ir({ nombre: "checkout" })}
                        />
                        <View style={{ height: 8 }} />
                        <Boton texto="Seguir comprando" variante="secundario" onPress={volver} />
                    </BarraInferior>
                </>
            )}
        </View>
    );
}

const estilos = StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    vacioEmoji: { fontSize: 48 },
    vacioTexto: { fontSize: 16, color: colores.textoSuave, marginVertical: 12 },
    lista: { padding: 16 },
    fila: {
        backgroundColor: colores.tarjeta,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colores.borde,
        padding: 14,
        marginBottom: 12
    },
    marca: { fontSize: 11, letterSpacing: 1.2, color: colores.acento, fontWeight: "700" },
    nombre: { fontSize: 16, fontWeight: "700", color: colores.texto, marginTop: 2 },
    detalle: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
    controles: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 12
    },
    subtotal: { fontSize: 16, fontWeight: "700", color: colores.texto },
    quitar: { color: colores.error, fontSize: 13, marginTop: 10, fontWeight: "600" },
    vaciar: { alignItems: "center", paddingVertical: 12 },
    vaciarTexto: { color: colores.textoSuave, textDecorationLine: "underline" },
    totalFila: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12
    },
    totalEtiqueta: { fontSize: 16, color: colores.textoSuave },
    total: { fontSize: 22, fontWeight: "700", color: colores.texto }
});
