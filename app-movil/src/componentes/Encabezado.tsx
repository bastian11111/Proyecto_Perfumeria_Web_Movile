import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { useCarrito } from "../estado/CarritoContext";
import { useNavegacion } from "../navegacion/contexto";
import { colores } from "../tema";

interface Props {
    titulo: string;
    mostrarVolver?: boolean;
    mostrarCarrito?: boolean;
    alVolver?: () => void; // si no se indica, vuelve a la pantalla anterior
}

export function Encabezado({
    titulo,
    mostrarVolver = false,
    mostrarCarrito = true,
    alVolver
}: Props) {
    const { ir, volver } = useNavegacion();
    const { cantidadTotal } = useCarrito();

    return (
        <View style={estilos.barra}>
            <View style={estilos.lado}>
                {mostrarVolver && (
                    <Pressable onPress={alVolver ?? volver} hitSlop={12}>
                        <Text style={estilos.volver}>‹</Text>
                    </Pressable>
                )}
            </View>
            <Text style={estilos.titulo} numberOfLines={1}>
                {titulo}
            </Text>
            <View style={[estilos.lado, { alignItems: "flex-end" }]}>
                {mostrarCarrito && (
                    <Pressable onPress={() => ir({ nombre: "carrito" })} hitSlop={12}>
                        <Text style={estilos.carrito}>
                            🛒{cantidadTotal > 0 ? ` ${cantidadTotal}` : ""}
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

const margenSuperior =
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 8 : 54;

const estilos = StyleSheet.create({
    barra: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: margenSuperior,
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: colores.tarjeta,
        borderBottomWidth: 1,
        borderBottomColor: colores.borde
    },
    lado: { width: 56 },
    titulo: {
        flex: 1,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "700",
        color: colores.texto
    },
    volver: { fontSize: 34, lineHeight: 34, color: colores.primario },
    carrito: { fontSize: 18, color: colores.primario }
});
