import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colores } from "../tema";

interface Props {
    texto: string;
    onPress: () => void;
    variante?: "primario" | "secundario" | "peligro";
    deshabilitado?: boolean;
    cargando?: boolean;
    compacto?: boolean;
}

export function Boton({
    texto,
    onPress,
    variante = "primario",
    deshabilitado = false,
    cargando = false,
    compacto = false
}: Props) {
    const inactivo = deshabilitado || cargando;
    const colorTexto = variante === "secundario" ? colores.primario : "#FFFFFF";

    return (
        <Pressable
            onPress={onPress}
            disabled={inactivo}
            style={({ pressed }) => [
                estilos.base,
                compacto && estilos.compacto,
                variante === "secundario" && estilos.secundario,
                variante === "peligro" && estilos.peligro,
                variante === "primario" && estilos.primario,
                inactivo && estilos.inactivo,
                pressed && { opacity: 0.85 }
            ]}
        >
            {cargando ? (
                <ActivityIndicator color={colorTexto} />
            ) : (
                <Text style={[estilos.texto, { color: colorTexto }]}>{texto}</Text>
            )}
        </Pressable>
    );
}

const estilos = StyleSheet.create({
    base: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center"
    },
    compacto: { paddingVertical: 9, paddingHorizontal: 14 },
    primario: { backgroundColor: colores.primario },
    secundario: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: colores.primario
    },
    peligro: { backgroundColor: colores.error },
    inactivo: { opacity: 0.5 },
    texto: { fontSize: 15, fontWeight: "600" }
});
